// Shared content loader.
// Admin portal (index.json on Cloudflare R2) is the sole source of truth (Option A).
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

  function resolveData(admin, seed) {
    // Option A: Admin portal is the single source of truth.
    // If admin data exists and has projects or clients, only admin data is returned.
    const hasAdminData = admin && (
      (Array.isArray(admin.projects) && admin.projects.length > 0) ||
      (Array.isArray(admin.clients) && admin.clients.length > 0)
    );

    if (hasAdminData) {
      const projects = (admin.projects || []).filter(p => p.status !== 'draft');
      const clients = (admin.clients || []).filter(c => c.status !== 'draft');
      const categories = admin.categories || [];
      return {
        categories,
        clients,
        projects,
        home: admin.home || {}
      };
    }

    // Offline / fallback only if admin data is unreachable or completely empty
    const fallbackProjects = (seed.projects || []).filter(p => p.status !== 'draft');
    return {
      categories: seed.categories || [],
      clients: seed.clients || [],
      projects: fallbackProjects,
      home: seed.home || {}
    };
  }

  let cache;
  const load = () => cache || (cache = (async () => {
    const demo = new URLSearchParams(location.search).get('demo') === '1';
    const adminPath = demo ? 'assets/data/index.sample.json' : (base ? `${base}/${indexPath}` : '');
    const [seed, admin] = await Promise.all([
      getJson(SEED).catch(() => ({})),
      adminPath ? getJson(adminPath).catch(e => { console.warn('Admin data unavailable, using fallback:', e); return {}; }) : {}
    ]);
    return resolveData(Array.isArray(admin) ? { projects: admin } : admin, seed);
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
