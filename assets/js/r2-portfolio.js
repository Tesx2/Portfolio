(function () {
  const config = window.VINCE_R2_PORTFOLIO || {};
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '');
  const indexPath = (config.indexPath || 'index.json').replace(/^\//, '');

  // No R2 bucket configured: keep the static HTML galleries as they are.
  if (!baseUrl) return;

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  // Absolute URLs are kept; bucket keys like "posters/foo.webp" are resolved against baseUrl.
  const resolveUrl = value => {
    if (!value) return '';
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;
    return `${baseUrl}/${String(value).replace(/^\//, '')}`;
  };

  const normalizeProject = project => ({
    title: project.title || 'Untitled Project',
    category: project.category || '',
    subcategory: project.subcategory || '',
    image: resolveUrl(project.image || project.cover || project.featuredImage || project.thumbnail),
    video: /^https?:\/\/(www\.)?(youtube|youtube-nocookie|player\.vimeo)\./i.test(project.video || project.videoUrl || '')
      ? (project.video || project.videoUrl)
      : resolveUrl(project.video || project.videoUrl),
    externalUrl: project.externalUrl || '',
    summary: project.summary || '',
    client: project.client || '',
    year: project.year || '',
    tools: Array.isArray(project.tools) ? project.tools.join(', ') : (project.tools || ''),
    result: project.result || '',
    featured: Boolean(project.featured),
    order: Number(project.order || 0)
  });

  const same = (a, b) => !b || String(a).toLowerCase() === String(b).toLowerCase();

  const renderMedia = project => {
    if (project.video && /\.(mp4|webm|ogg)(\?.*)?$/i.test(project.video)) {
      return `<video src="${escapeHtml(project.video)}" controls preload="metadata"${project.image ? ` poster="${escapeHtml(project.image)}"` : ''}></video>`;
    }
    if (project.video && /youtube\.com\/embed|youtube-nocookie\.com\/embed|player\.vimeo\.com\/video/i.test(project.video)) {
      return `<iframe src="${escapeHtml(project.video)}" title="${escapeHtml(project.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    if (project.image) {
      return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy">`;
    }
    return '<div class="project-placeholder" aria-hidden="true"></div>';
  };

  const renderFigure = project => {
    const details = [project.client, project.year, project.tools].filter(Boolean).join(' • ');
    const link = project.externalUrl
      ? `<a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener" class="demo-btn">View Project</a>`
      : '';
    return `
      <figure class="project-card">
        ${renderMedia(project)}
        <figcaption>
          <strong>${escapeHtml(project.title)}</strong>
          ${project.summary ? `<span>${escapeHtml(project.summary)}</span>` : ''}
          ${details ? `<small>${escapeHtml(details)}</small>` : ''}
          ${project.result ? `<span>${escapeHtml(project.result)}</span>` : ''}
          ${link}
        </figcaption>
      </figure>`;
  };

  const renderFeatureCard = project => {
    const href = project.externalUrl || '#portfolio';
    return `
      <a href="${escapeHtml(href)}" class="card feature-card project-card"${project.externalUrl ? ' target="_blank" rel="noopener"' : ''}>
        <div class="card-media">${renderMedia(project)}</div>
        <div class="card-body">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.category || 'Portfolio')} ${project.summary ? '• ' + escapeHtml(project.summary) : ''}</p>
          <span class="btn">${project.externalUrl ? 'View Project' : 'View Work'}</span>
        </div>
      </a>`;
  };

  const render = (container, projects) => {
    const { category, subcategory, featured, render: mode, limit } = container.dataset;
    let list = projects
      .filter(p => same(p.category, category))
      .filter(p => same(p.subcategory, subcategory))
      .filter(p => !featured || p.featured === (featured === 'true'))
      .sort((a, b) => a.order - b.order);
    if (limit) list = list.slice(0, Number(limit));
    if (!list.length) return; // keep the static fallback markup
    container.dataset.r2Loaded = 'true';
    container.innerHTML = list.map(p => (mode === 'featured' ? renderFeatureCard(p) : renderFigure(p))).join('');
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const containers = document.querySelectorAll('[data-projects]');
    if (!containers.length) return;
    try {
      const response = await fetch(`${baseUrl}/${indexPath}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`R2 request failed: ${response.status}`);
      const data = await response.json();
      const projects = (Array.isArray(data) ? data : (data.projects || [])).map(normalizeProject);
      containers.forEach(c => render(c, projects));
    } catch (error) {
      console.warn('R2 portfolio unavailable, using static galleries:', error);
    }
  });
}());
