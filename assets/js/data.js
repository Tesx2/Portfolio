// Shared content loader.
// The admin portal's index.json on Cloudflare R2 is the only source of content:
// projects, clients, categories, media and every number shown on the site.
(function () {
  const cfg = window.VINCE_R2_PORTFOLIO || {};
  const base = (cfg.baseUrl || '').replace(/\/$/, '');
  const indexPath = (cfg.indexPath || 'index.json').replace(/^\//, '');

  // Absolute URLs stay as they are; any other value is a bucket key resolved against the R2 base URL.
  const url = v => {
    if (!v) return '';
    if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:')) return v;
    return `${base}/${String(v).replace(/^\//, '')}`;
  };

  const getJson = async path => {
    const res = await fetch(path, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
  };

  let cache;
  const load = () => cache || (cache = (async () => {
    const demo = new URLSearchParams(location.search).get('demo') === '1';
    const path = demo ? 'assets/data/index.sample.json' : (base ? `${base}/${indexPath}` : '');
    if (!path) throw new Error('R2 baseUrl is not set in assets/js/r2-config.js');
    let admin = await getJson(path);
    if (Array.isArray(admin)) admin = { projects: admin };
    return {
      categories: admin.categories || [],
      clients: (admin.clients || []).filter(c => c.status !== 'draft'),
      projects: (admin.projects || []).filter(p => p.status !== 'draft'),
      home: admin.home || {}
    };
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
