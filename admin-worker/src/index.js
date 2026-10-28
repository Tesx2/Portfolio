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
  projects: (db.projects || []).filter(p => p.status !== 'draft' && (db.clients || []).some(c => c.slug === p.client && !c.archived))
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
      const db = await request.json(), cur = await env.PRIVATE.get('db.json'), rev = cur ? (await cur.json()).rev || 0 : 0;
      if (!Array.isArray(db.clients) || !Array.isArray(db.projects) || (db.rev || 0) !== rev) return json({ error: 'Out of date. Reload and try again.' }, 409);
      db.rev = rev + 1;
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
    return json({ error: 'Not found' }, 404);
  }
};
