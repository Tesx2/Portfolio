// Portfolio admin: Better Auth (email + password, 1-hour sessions, emailed reset link) in front of the R2 publishing API.
import { makeAuth } from './auth.js';
const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...h } });

const KEY_OK = /^clients\/[a-z0-9][a-z0-9/_.-]{0,180}$/;
const TYPES = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf' };
const MAX = 100 * 1024 * 1024; // Worker request body limit

// Public index.json = published projects of public clients only.
const publicIndex = db => ({
  categories: db.categories || [],
  clients: (db.clients || []).filter(c => !c.archived).map(c => c.showName === false ? { slug: c.slug, name: 'Confidential client', showName: false, publicLabel: c.publicLabel || '' } : c),
  projects: (db.projects || []).filter(p => p.status !== 'draft' && (db.clients || []).some(c => c.slug === p.client && !c.archived)),
  home: db.home || {}
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url), path = url.pathname;
    if (!env.BETTER_AUTH_SECRET) return json({ error: 'Server not configured' }, 500);
    const auth = makeAuth(env, ctx);
    if (path.startsWith('/api/auth/')) return auth.handler(request);

    if (path === '/api/setup') { // one-time creation of the admin account, only while no user exists
      const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
      const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM user').first())?.n || 0;
      if (request.method === 'GET') return json({ needed: n === 0 });
      if (n > 0 || !env.SETUP_TOKEN || body.token !== env.SETUP_TOKEN || request.headers.get('Origin') !== url.origin) return json({ error: 'Not allowed' }, 403);
      try { await makeAuth(env, ctx, { allowSignUp: true }).api.signUpEmail({ body: { name: 'Admin', email: env.ADMIN_EMAIL, password: String(body.password || '') } }); }
      catch (e) { return json({ error: e.message || 'Could not create account' }, 400); }
      return json({ ok: true });
    }
    if (path === '/login.html') return Response.redirect(`${url.origin}/login`, 302);
    if (path === '/login') return env.ASSETS.fetch(request); // assets serve login.html at /login

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || String(session.user.email).toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      return path.startsWith('/api/') ? json({ error: 'Unauthorized' }, 401) : Response.redirect(`${url.origin}/login`, 302);
    }
    if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);

    if (request.method !== 'GET') { // CSRF: same-origin only
      if (request.headers.get('Origin') !== url.origin || request.headers.get('X-Admin') !== '1') return json({ error: 'Forbidden' }, 403);
    }
    if (url.pathname === '/api/db' && request.method === 'GET') {
      const o = await env.PRIVATE.get('db.json');
      return json(o ? await o.json() : { rev: 0, categories: [], clients: [], projects: [] });
    }
    if (url.pathname === '/api/db' && request.method === 'PUT') {
      const db = await request.json(), cur = await env.PRIVATE.get('db.json'), prev = cur ? await cur.json() : null, rev = prev ? prev.rev || 0 : 0;
      if (!Array.isArray(db.clients) || !Array.isArray(db.projects) || (db.rev || 0) !== rev) return json({ error: 'Out of date. Reload and try again.' }, 409);
      db.rev = rev + 1;
      if (prev) { // keep the last 30 versions
        await env.PRIVATE.put(`backups/${String(rev).padStart(6, '0')}.json`, JSON.stringify(prev));
        const old = (await env.PRIVATE.list({ prefix: 'backups/' })).objects.map(o => o.key).sort().slice(0, -30);
        for (const k of old) await env.PRIVATE.delete(k);
      }
      await env.PRIVATE.put('db.json', JSON.stringify(db));
      await env.MEDIA.put('index.json', JSON.stringify(publicIndex(db)), { httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=60' } });
      return json({ ok: true, rev: db.rev });
    }
    if (url.pathname === '/api/upload' && request.method === 'PUT') {
      const key = url.searchParams.get('key') || '', ext = key.split('.').pop().toLowerCase();
      if (!KEY_OK.test(key) || key.includes('..') || !TYPES[ext]) return json({ error: 'Bad file name or type' }, 400);
      if (Number(request.headers.get('Content-Length') || 0) > MAX) return json({ error: 'File over 100 MB' }, 413);
      await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: TYPES[ext], cacheControl: 'public, max-age=31536000, immutable' } });
      return json({ ok: true, key });
    }
    if (url.pathname === '/api/trash' && request.method === 'POST') { // move files to private trash/ (set a 30-day lifecycle rule on that prefix)
      const { keys = [] } = await request.json();
      for (const k of keys.filter(k => KEY_OK.test(k) && !k.includes('..'))) {
        const o = await env.MEDIA.get(k);
        if (o) { await env.PRIVATE.put(`trash/${Date.now()}/${k}`, o.body); await env.MEDIA.delete(k); }
      }
      return json({ ok: true });
    }
    if (url.pathname === '/api/backups' && request.method === 'GET') {
      const l = await env.PRIVATE.list({ prefix: 'backups/' });
      return json({ items: l.objects.map(o => ({ key: o.key, rev: parseInt(o.key.slice(8), 10), uploaded: o.uploaded })) });
    }
    if (url.pathname === '/api/backup' && request.method === 'GET') {
      const key = url.searchParams.get('key') || '', o = /^backups\/\d{6}\.json$/.test(key) ? await env.PRIVATE.get(key) : null;
      return o ? json(await o.json()) : json({ error: 'Not found' }, 404);
    }
    if (url.pathname === '/api/trash' && request.method === 'GET') {
      const l = await env.PRIVATE.list({ prefix: 'trash/' });
      return json({ items: l.objects.map(o => { const [, ts, ...f] = o.key.split('/'); return { key: o.key, ts: Number(ts), file: f.join('/') }; }).reverse().slice(0, 200) });
    }
    if (url.pathname === '/api/restore' && request.method === 'POST') {
      const { key = '' } = await request.json(), m = key.match(/^trash\/\d+\/(clients\/.+)$/), name = m && m[1];
      if (!name || name.includes('..') || !KEY_OK.test(name)) return json({ error: 'Bad key' }, 400);
      const o = await env.PRIVATE.get(key);
      if (!o) return json({ error: 'Not found' }, 404);
      await env.MEDIA.put(name, o.body, { httpMetadata: { contentType: TYPES[name.split('.').pop().toLowerCase()], cacheControl: 'public, max-age=31536000, immutable' } });
      await env.PRIVATE.delete(key);
      return json({ ok: true });
    }
    if (url.pathname === '/api/screenshot' && request.method === 'GET') {
      let u;
      try { u = new URL(url.searchParams.get('url') || ''); } catch { return json({ error: 'Enter a full website address' }, 400); }
      const h = u.hostname;
      if (!/^https?:$/.test(u.protocol) || !h.includes('.') || /^(localhost|\d+\.\d+\.\d+\.\d+|\[)/i.test(h) || /\.(local|internal|lan)$/i.test(h)) return json({ error: 'That address cannot be captured' }, 400);
      if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return json({ error: 'Screenshots are not set up yet (add the CF_API_TOKEN and CF_ACCOUNT_ID secrets)' }, 501);
      const mobile = url.searchParams.get('mobile') === '1';
      const init = {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: u.href,
          viewport: mobile ? { width: 390, height: 844, deviceScaleFactor: 2 } : { width: 1440, height: 900 },
          ...(mobile ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : {}),
          gotoOptions: { waitUntil: 'networkidle2', timeout: 25000 },
          addStyleTag: [{ content: '#onetrust-banner-sdk,#CybotCookiebotDialog,.cookie-banner,.cookie-notice,#cookie-law-info-bar{display:none!important}' }]
        })
      };
      const call = route => fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/${route}/screenshot`, init);
      let r = await call('browser-run');
      if (r.status === 404) r = await call('browser-rendering'); // older route name
      if (!r.ok) return json({ error: r.status === 429 ? 'The free daily screenshot limit is reached. Try again tomorrow or upload a screenshot.' : `Capture failed (${r.status}). The site may block automated visits.` }, r.status === 429 ? 429 : 502);
      return new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/png', 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/api/health' && request.method === 'GET') { // every media file that exists, to spot broken references
      const keys = []; let cursor;
      do { const l = await env.MEDIA.list({ prefix: 'clients/', cursor }); keys.push(...l.objects.map(o => o.key)); cursor = l.truncated ? l.cursor : undefined; } while (cursor);
      return json({ keys });
    }
    return json({ error: 'Not found' }, 404);
  }
};
