(function () {
  const { url, load } = window.PortfolioData;
  const view = document.querySelector('main[data-view]')?.dataset.view;
  const qs = new URLSearchParams(location.search);
  const PAGE = 12;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isVideo = v => /\.(mp4|webm|ogg)(\?.*)?$/i.test(v || '');
  const slugOf = c => c.slug;


  // ---- Media model: p.media = [{type:'image'|'video'|'embed'|'pdf', ...}] (old p.cover/p.images still work) ----
  const parseRatio = r => { const m = String(r || '').match(/^(\d+(?:\.\d+)?)\s*[:\/x]\s*(\d+(?:\.\d+)?)$/); return m ? [Number(m[1]), Number(m[2])] : null; };
  const shapeOf = ([w, h]) => { const r = w / h; return r >= 1.3 ? 'wide' : (r <= 0.8 ? 'tall' : 'square'); };

  function embedOf(raw) {
    let u; try { u = new URL(raw); } catch (e) { return null; }
    const h = u.hostname.replace(/^(www|m)\./, ''), p = u.pathname; let m;
    const yt = id => ({ provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}` });
    if (h === 'youtu.be' && (m = p.match(/^\/([\w-]{11})/))) return { ...yt(m[1]), ratio: [16, 9] };
    if (h.endsWith('youtube.com')) {
      if ((m = p.match(/^\/shorts\/([\w-]{11})/))) return { ...yt(m[1]), ratio: [9, 16] };
      const id = u.searchParams.get('v') || (p.match(/^\/embed\/([\w-]{11})/) || [])[1];
      if (id) return { ...yt(id), ratio: [16, 9] };
    }
    if (h === 'vimeo.com' && (m = p.match(/^\/(?:video\/)?(\d+)/))) return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${m[1]}`, ratio: [16, 9] };
    if (h === 'instagram.com' && (m = p.match(/^\/(reel|reels|p|tv)\/([\w-]+)/))) {
      const t = m[1] === 'reels' ? 'reel' : m[1];
      return { provider: 'Instagram', src: `https://www.instagram.com/${t}/${m[2]}/embed`, ratio: t === 'p' ? [4, 5] : [9, 16] };
    }
    if (h === 'tiktok.com' && (m = p.match(/\/video\/(\d+)/))) return { provider: 'TikTok', src: `https://www.tiktok.com/embed/v2/${m[1]}`, ratio: [9, 16] };
    if (h === 'facebook.com' || h === 'fb.watch') return { provider: 'Facebook', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false`, ratio: /\/reel\//.test(p) ? [9, 16] : [16, 9] };
    return null;
  }

  const mediaOf = p => {
    if (Array.isArray(p.media) && p.media.length) return p.media;
    return [p.cover, ...(p.images || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)
      .map(src => isVideo(src) ? { type: 'video', src } : { type: 'image', src });
  };
  const coverInfo = p => {
    if (p.cover) return { src: p.cover, ratio: p.coverWidth && p.coverHeight ? p.coverWidth / p.coverHeight : null };
    for (const m of mediaOf(p)) {
      const wh = m.width && m.height ? m.width / m.height : null;
      if (m.type === 'image') return { src: m.src, ratio: wh };
      if ((m.type === 'video' || m.type === 'embed') && m.poster) {
        const r = parseRatio(m.ratio) || (m.type === 'embed' ? (embedOf(m.url || '') || {}).ratio : [16, 9]);
        return { src: m.poster, ratio: wh || (r ? r[0] / r[1] : null) };
      }
      if (m.type === 'pdf') { const src = m.cover || (m.pages || [])[0]; if (src) return { src, ratio: wh || 1 / 1.414 }; }
    }
    return { src: '', ratio: null };
  };
  const frameRatio = r => Math.min(2, Math.max(0.6, r)); // tallest 1:1.67, widest 2:1
  const badge = p => { const t = mediaOf(p).map(m => m.type); return t.includes('pdf') ? 'PDF' : (t.includes('video') || t.includes('embed')) ? 'Video' : ''; };

  function renderPdf(m, title) {
    const name = m.title || title, pages = (m.pages || []).map(url), cover = url(m.cover) || pages[0];
    const open = esc(url(m.src));
    const body = pages.length
      ? `<div class="pm-pages">${pages.map((s, i) => `<img src="${esc(s)}" alt="${esc(name)} page ${i + 1}" loading="lazy"${i >= 4 ? ' hidden' : ''}>`).join('')}</div>${pages.length > 4 ? `<button class="btn pm-showall" type="button">Show all ${pages.length} pages</button>` : ''}`
      : (cover ? `<div class="pm-pages"><img src="${esc(cover)}" alt="${esc(name)}" loading="lazy"></div>` : '');
    return `<div class="pm pm-doc" data-shape="wide"><div class="pm-doc-head"><strong>${esc(name)}</strong><span><a class="btn" href="${open}" target="_blank" rel="noopener">Open PDF</a> <a class="btn" href="${open}" download>Download</a></span></div>${body}</div>`;
  }

  function renderItem(m, title) {
    if (m.type === 'pdf') return renderPdf(m, title);
    let ratio = parseRatio(m.ratio), inner = '', after = '';
    if (m.type === 'image') {
      if (!ratio && m.width && m.height) ratio = [m.width, m.height];
      const srcset = (m.srcset || []).map(x => `${esc(url(x.src))} ${Number(x.w)}w`).join(', ');
      inner = `<a href="${esc(url(m.src))}" target="_blank" rel="noopener"><img src="${esc(url(m.src))}"${srcset ? ` srcset="${srcset}" sizes="(max-width:700px) 100vw, 1100px"` : ''}${m.width && m.height ? ` width="${Number(m.width)}" height="${Number(m.height)}"` : ''} alt="${esc(m.alt || title)}" loading="lazy"></a>`;
    } else if (m.type === 'video') {
      ratio = ratio || [16, 9];
      inner = `<div class="pm-frame" style="aspect-ratio:${ratio[0]}/${ratio[1]}"><video src="${esc(url(m.src))}" controls playsinline preload="metadata"${m.poster ? ` poster="${esc(url(m.poster))}"` : ''}></video></div>`;
    } else if (m.type === 'embed') {
      const e = embedOf(m.url || '');
      if (!e) return m.url ? `<div class="pm pm-link" data-shape="wide"><a class="btn" href="${esc(m.url)}" target="_blank" rel="noopener">Watch video</a></div>` : '';
      ratio = ratio || e.ratio;
      inner = `<div class="pm-frame" style="aspect-ratio:${ratio[0]}/${ratio[1]}"><iframe src="${esc(e.src)}" title="${esc(title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
      after = `<a class="pm-out" href="${esc(m.url)}" target="_blank" rel="noopener">Watch on ${e.provider}</a>`;
    } else return '';
    return `<div class="pm" data-shape="${ratio ? shapeOf(ratio) : 'wide'}">${inner}${after}</div>`;
  }

  let clients = [], projects = [], content = {};
  const clientOf = p => clients.find(c => c.slug === p.client) || { slug: p.client, name: p.client, showName: true };
  const label = p => { const c = clientOf(p); return c.showName === false ? (c.publicLabel || 'Confidential client') : c.name; };
  const projHref = p => `project.html?p=${encodeURIComponent(p.slug)}`;

  const card = p => {
    const c = coverInfo(p), b = badge(p);
    const frame = c.ratio ? ` style="aspect-ratio:${frameRatio(c.ratio).toFixed(3)}"` : ' data-auto';
    return `<a class="work-card" href="${projHref(p)}"><div class="ph"${frame}>${c.src ? `<img src="${esc(url(c.src))}" alt="${esc(p.title)}" loading="lazy">` : ''}${b ? `<span class="work-badge">${b}</span>` : ''}</div><div class="tx"><strong>${esc(p.title)}</strong><small>${[p.subcategory || p.category, label(p), p.year].filter(Boolean).map(esc).join(' · ')}</small></div></a>`;
  };
  const sorted = list => [...list].sort((a, b) => (Number(a.order || 0) - Number(b.order || 0)) || String(b.year || '').localeCompare(String(a.year || '')));
  const empty = (el, msg) => { el.innerHTML = `<p class="work-empty">${esc(msg)}</p>`; };

  // ---- Categories and subcategories (optional taxonomy in index.json: [{name, subcategories:[...]}]) ----
  let taxonomy = [];
  const same = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
  const catIdx = c => { const i = taxonomy.findIndex(t => same(t.name, c)); return i < 0 ? 999 : i; };
  const subIdx = (c, s) => { const t = taxonomy.find(t => same(t.name, c)); const i = t ? (t.subcategories || []).findIndex(x => same(x, s)) : -1; return i < 0 ? 999 : i; };
  const sortGrouped = list => [...list].sort((a, b) =>
    (catIdx(a.category) - catIdx(b.category)) || String(a.category).localeCompare(b.category) ||
    (!a.subcategory - !b.subcategory) || (subIdx(a.category, a.subcategory) - subIdx(b.category, b.subcategory)) ||
    String(a.subcategory || '').localeCompare(b.subcategory || '') ||
    (Number(a.order || 0) - Number(b.order || 0)) || String(b.year || '').localeCompare(String(a.year || '')));
  // One grid per subcategory, each with its own heading; a single group is shown without a heading.
  const grouped = list => {
    const names = [...new Set(list.map(p => p.subcategory || ''))];
    if (names.length < 2) return `<div class="work-grid">${list.map(card).join('')}</div>`;
    return names.map(n => `<div class="work-subgroup"><h3 class="work-sub">${esc(n || 'Other')}</h3><div class="work-grid">${list.filter(p => (p.subcategory || '') === n).map(card).join('')}</div></div>`).join('');
  };

  function work() {
    let cat = qs.get('category') || '', sub = qs.get('sub') || '', cl = qs.get('client') || '', shown = PAGE;
    const cats = [...new Set(projects.map(p => p.category).filter(Boolean))].sort((a, b) => (catIdx(a) - catIdx(b)) || a.localeCompare(b));
    const clist = clients.filter(c => c.showName !== false && projects.some(p => p.client === c.slug));
    const draw = () => {
      const inCat = projects.filter(p => !cat || same(p.category, cat));
      const subs = cat ? [...new Set(inCat.map(p => p.subcategory).filter(Boolean))].sort((a, b) => (subIdx(cat, a) - subIdx(cat, b)) || a.localeCompare(b)) : [];
      $('filters').innerHTML = `<button class="work-chip ${cat ? '' : 'on'}" data-cat="">All</button>` +
        cats.map(c => `<button class="work-chip ${same(cat, c) ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('') +
        (clist.length ? `<select id="client-sel"><option value="">All clients</option>${clist.map(c => `<option value="${esc(slugOf(c))}" ${cl === c.slug ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : '') +
        (subs.length > 1 ? `<div class="work-subfilters"><button class="work-chip sub ${sub ? '' : 'on'}" data-sub="">All ${esc(cat)}</button>${subs.map(x => `<button class="work-chip sub ${same(sub, x) ? 'on' : ''}" data-sub="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : '');
      const list = sortGrouped(inCat.filter(p => (!sub || same(p.subcategory, sub)) && (!cl || p.client === cl)));
      if (!list.length) { $('grid').className = ''; empty($('grid'), 'No projects match this filter.'); $('more').hidden = true; return; }
      const page = list.slice(0, shown);
      const byGroup = cat && !sub && new Set(page.map(p => p.subcategory || '')).size > 1;
      $('grid').className = byGroup ? '' : 'work-grid';
      $('grid').innerHTML = byGroup ? grouped(page) : page.map(card).join('');
      $('more').hidden = list.length <= shown;
    };
    $('filters').addEventListener('click', e => {
      const c = e.target.closest('[data-cat]'), s2 = e.target.closest('[data-sub]');
      if (c) { cat = c.dataset.cat; sub = ''; shown = PAGE; draw(); }
      else if (s2) { sub = s2.dataset.sub; shown = PAGE; draw(); }
    });
    $('filters').addEventListener('change', e => { if (e.target.id === 'client-sel') { cl = e.target.value; shown = PAGE; draw(); } });
    $('more').addEventListener('click', () => { shown += PAGE; draw(); });
    draw();
  }

    function home() {
    // 1. Featured projects: directly from admin projects marked featured: true (or latest)
    const feat = projects.filter(p => p.featured);
    const pool = sorted(feat.length ? feat : projects).slice(0, 6);
    const featured = $('home-featured');
    if (featured) {
      if (pool.length) {
        featured.innerHTML = pool.map((p, idx) => {
          const c = coverInfo(p);
          const isWide = idx === 0 && pool.length >= 3;
          return `
            <a href="${projHref(p)}" class="card feature-card${isWide ? ' wide' : ''}">
              <div class="card-media">
                ${c.src ? `<img src="${esc(url(c.src))}" alt="${esc(p.title)}" loading="lazy">` : ''}
              </div>
              <div class="card-body">
                <span class="card-meta">${esc(p.category || 'Project')}${p.subcategory ? ' • ' + esc(p.subcategory) : ''}</span>
                <h3 class="card-title">${esc(p.title)}</h3>
                <p class="card-desc">${esc(p.summary || '')}</p>
                <span class="card-cta">View Project &rarr;</span>
              </div>
            </a>`;
        }).join('');
      } else {
        featured.innerHTML = `<p class="work-empty" style="grid-column: 1 / -1; text-align: center;">No projects published yet. Upload and feature projects in your admin portal.</p>`;
      }
    }

    // 2. Categories row: dynamically generated from admin projects
    const tiles = $('home-categories');
    if (tiles) {
      const cats = [...new Set(projects.map(p => p.category).filter(Boolean))].sort((a, b) => (catIdx(a) - catIdx(b)) || a.localeCompare(b));
      if (cats.length) {
        tiles.innerHTML = cats.map(c => {
          const inCat = sorted(projects.filter(p => same(p.category, c)));
          const ci = coverInfo(inCat[0] || {});
          return `
            <a href="work.html?category=${encodeURIComponent(c)}" class="category-tile">
              <div class="category-tile-thumb">
                ${ci.src ? `<img src="${esc(url(ci.src))}" alt="${esc(c)}" loading="lazy">` : ''}
              </div>
              <span class="category-tile-name">${esc(c)}</span>
              <span style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${inCat.length} ${inCat.length === 1 ? 'project' : 'projects'}</span>
            </a>`;
        }).join('');
      } else {
        tiles.innerHTML = `<p class="work-empty" style="grid-column: 1 / -1; text-align: center;">Categories will appear as projects are uploaded in admin.</p>`;
      }
    }

    // 3. Case Studies (if any in content.home or admin)
    const cases = $('home-case-studies');
    const secCases = $('case-studies');
    const h = content.home || {};
    if (cases) {
      const caseList = h.caseStudies || [];
      if (caseList.length) {
        cases.innerHTML = caseList.map(c => `
          <div class="service-card">
            <h3 class="service-title">${esc(c.title)}</h3>
            <p><strong>Goal:</strong> ${esc(c.goal)}</p>
            <p><strong>Role:</strong> ${esc(c.role)}</p>
            <p><strong>Result:</strong> ${esc(c.result)}</p>
            <span class="case-tools" style="display:block; margin-top:14px;">${(c.tools || []).map(esc).join(' • ')}</span>
          </div>`).join('');
      } else if (secCases) {
        secCases.hidden = true;
      }
    }

    // 4. Clients strip: dynamically generated from admin clients
    const strip = $('home-clients');
    if (strip) {
      const hasWork = c => projects.some(p => p.client === c.slug);
      const clientList = clients.filter(c => c.showName !== false);
      if (clientList.length) {
        strip.innerHTML = clientList.map(c => {
          const count = projects.filter(p => p.client === c.slug).length;
          return hasWork(c)
            ? `<a href="client.html?c=${encodeURIComponent(c.slug)}" class="client-item">${esc(c.name)} <span style="font-size:0.75rem; opacity:0.65; font-weight:normal;">(${count})</span></a>`
            : `<span class="client-item">${esc(c.name)}</span>`;
        }).join('');
      } else {
        strip.innerHTML = `<p class="work-empty">Clients will appear as you add them in admin.</p>`;
      }
    }

    // 5. Dynamic Stats Row: Real metrics calculated from admin data
    const statProjects = $('stat-projects');
    if (statProjects) {
      const n = projects.length;
      statProjects.textContent = n ? `${n}${n >= 10 ? '+' : ''}` : '0';
    }

    const statDisciplines = $('stat-disciplines');
    if (statDisciplines) {
      const discCount = new Set(projects.map(p => p.category).filter(Boolean)).size;
      statDisciplines.textContent = discCount || (taxonomy.length || 0);
    }

    const statClients = $('stat-clients');
    if (statClients) {
      statClients.textContent = clients.length ? `${clients.length}` : '0';
    }
  }

  function clientPage() {
    const c = clients.find(x => x.slug === qs.get('c'));
    if (!c || c.showName === false) return empty($('client-head'), 'Client not found.');
    document.title = `${c.name} | Vincent Mwangi`;
    $('client-head').innerHTML = `<div class="client-head">${c.logo ? `<img src="${esc(url(c.logo))}" alt="${esc(c.name)}">` : ''}<div><h1>${esc(c.name)}</h1>${c.about ? `<p>${esc(c.about)}</p>` : ''}</div></div>`;
    const mine = sorted(projects.filter(p => p.client === c.slug));
    const groups = [...new Set(mine.map(p => p.category))].sort((a, b) => (catIdx(a) - catIdx(b)) || a.localeCompare(b));
    $('client-groups').innerHTML = groups.map(g => `<div class="client-group"><h2>${esc(g)}</h2>${grouped(sortGrouped(mine.filter(p => p.category === g)))}</div>`).join('') || '<p class="work-empty">No projects yet.</p>';
  }

  function projectPage() {
    const p = projects.find(x => x.slug === qs.get('p'));
    if (!p) return empty($('project'), 'Project not found.');
    document.title = `${p.title} | Vincent Mwangi`;
    const c = clientOf(p);
    const list = (t, arr) => arr && arr.length ? `<div><b>${t}</b><ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    $('project').innerHTML = `<h1>${esc(p.title)}</h1><p class="work-lead">${esc(p.summary || '')}</p>
      <div class="proj-media">${mediaOf(p).map(m => renderItem(m, p.title)).join('')}</div>
      <div class="proj-meta">
        ${p.client ? `<div><b>Client</b>${c.showName === false ? esc(label(p)) : `<a href="client.html?c=${encodeURIComponent(c.slug)}">${esc(c.name)}</a>`}</div>` : ''}
        <div><b>Category</b>${esc(p.category)}${p.subcategory ? ' › ' + esc(p.subcategory) : ''}</div>${p.year ? `<div><b>Year</b>${esc(p.year)}</div>` : ''}
        ${list('Deliverables', p.deliverables)}${list('Tools', p.tools)}</div>`;
    const rel = sorted(projects.filter(x => x.slug !== p.slug && ((p.client && x.client === p.client) || x.category === p.category))).sort((a, b) => (same(b.subcategory, p.subcategory) && same(b.category, p.category)) - (same(a.subcategory, p.subcategory) && same(a.category, p.category))).slice(0, 4);
    if (rel.length) $('related').innerHTML = `<div class="client-group"><h2>Related work</h2><div class="work-grid">${rel.map(card).join('')}</div></div>`;
  }

  async function init() {
    const root = $('grid') || $('client-head') || $('project');
    try {
      content = await load();
      clients = content.clients;
      taxonomy = content.categories;
      projects = content.projects;
    } catch (e) { return root ? empty(root, 'Projects could not be loaded right now.') : null; }
    ({ work, client: clientPage, project: projectPage, home })[view]?.();
  }
  document.addEventListener('load', e => {
    const i = e.target, ph = i.tagName === 'IMG' && i.closest('.ph[data-auto]');
    if (ph && i.naturalWidth) { ph.style.aspectRatio = frameRatio(i.naturalWidth / i.naturalHeight).toFixed(3); ph.removeAttribute('data-auto'); }
  }, true);
  document.addEventListener('click', e => {
    const b = e.target.closest('.pm-showall'); if (!b) return;
    b.closest('.pm-doc').querySelectorAll('.pm-pages img[hidden]').forEach(i => i.removeAttribute('hidden'));
    b.remove();
  });
  document.addEventListener('DOMContentLoaded', init);
}());
