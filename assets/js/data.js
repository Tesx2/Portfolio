// Shared content loader.
// Content = assets/data/seed.json (lives in the repo) merged with the admin data
// (index.json on the R2 bucket). On a clash the admin entry wins, so anything edited
// in the admin replaces the seed entry instead of duplicating it.
(function () {
  const cfg = window.VINCE_R2_PORTFOLIO || {};
  const base = (cfg.baseUrl || '').replace(/\/$/, '');
  const indexPath = (cfg.indexPath || 'index.json').replace(/^\//, '');
  const SEED = 'assets/data/seed.json';

  // Absolute URLs and files shipped with the site ("assets/...") are kept as they are;
  // any other value is a bucket key and is resolved against the R2 base URL.
  const url = v => {
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('assets/')) return v;
    return `${base}/${String(v).replace(/^\//, '')}`;
  };

  const getJson = async path => {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  };

  const lower = v => String(v || '').toLowerCase();

  function merge(seed, admin) {
    // Projects: matched by slug, admin wins. Admin entries without a slug are always added.
    const projects = new Map();
    (seed.projects || []).forEach(p => projects.set(p.slug, { ...p, _seed: true }));
    (admin.projects || []).forEach((p, i) => projects.set(p.slug || `admin:${i}`, p));
    const visible = [...projects.values()].filter(p => p.status !== 'draft');

    // Clients: matched by slug or name, admin wins. A seed client keeps its place on the home strip.
    const clients = (seed.clients || []).map(c => ({ ...c, _seed: true }));
    (admin.clients || []).forEach(c => {
      const i = clients.findIndex(s => s.slug === c.slug || lower(s.name) === lower(c.name));
      if (i < 0) clients.push(c);
      else clients[i] = clients[i]._seed ? { ...c, _seed: true } : c;
    });

    // Categories: the admin order first, then seed categories it does not list; sub-categories are unioned.
    const categories = (admin.categories || []).map(c => ({ ...c }));
    (seed.categories || []).forEach(sc => {
      const mine = categories.find(c => lower(c.name) === lower(sc.name));
      if (!mine) return categories.push({ ...sc });
      const subs = mine.subcategories || [];
      (sc.subcategories || []).forEach(s => { if (!subs.some(x => lower(x) === lower(s))) subs.push(s); });
      if (subs.length) mine.subcategories = subs;
    });

    return { categories, clients, projects: visible, home: seed.home || {} };
  }

  let cache;
  const load = () => cache || (cache = (async () => {
    const demo = new URLSearchParams(location.search).get('demo') === '1';
    const adminPath = demo ? 'assets/data/index.sample.json' : (base ? `${base}/${indexPath}` : '');
    const [seed, admin] = await Promise.all([
      getJson(SEED),
      adminPath ? getJson(adminPath).catch(e => { console.warn('Admin data unavailable, showing seed content only:', e); return {}; }) : {}
    ]);
    return merge(seed, Array.isArray(admin) ? { projects: admin } : admin);
  })());

  // Hover to play / pause the video in a card. Delegated so it also works for cards rendered after load.
  const hover = play => e => {
    const card = e.target instanceof Element && e.target.matches('.gallery figure, .card-media') ? e.target : null;
    const video = card && card.querySelector('video');
    if (video) play ? video.play().catch(() => {}) : video.pause();
  };
  document.addEventListener('mouseenter', hover(true), true);
  document.addEventListener('mouseleave', hover(false), true);

  window.PortfolioData = { url, load };
}());
