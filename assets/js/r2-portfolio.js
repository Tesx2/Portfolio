(function () {
  const { url, load } = window.PortfolioData;

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const youtubeEmbed = link => {
    const m = String(link || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : '';
  };

  const normalizeProject = project => {
    const media = Array.isArray(project.media) ? project.media : [];
    const clip = media.find(m => m.type === 'video');
    const embed = media.find(m => m.type === 'embed');
    const rawVideo = project.video || project.videoUrl || (clip && clip.src) || '';
    return {
      title: project.title || 'Untitled Project',
      category: project.category || '',
      subcategory: project.subcategory || '',
      image: url(project.image || project.cover || project.featuredImage || project.thumbnail || (clip && clip.poster)),
      fallback: url(project.fallback),
      alt: project.alt || '',
      video: /^https?:\/\/(www\.)?(youtube|youtube-nocookie|player\.vimeo)\./i.test(rawVideo) ? rawVideo : url(rawVideo),
      embed: embed ? youtubeEmbed(embed.url) : '',
      externalUrl: project.externalUrl || '',
      linkLabel: project.linkLabel || '',
      summary: project.summary || '',
      client: project.client || '',
      year: project.year || '',
      tools: Array.isArray(project.tools) ? project.tools.join(', ') : (project.tools || ''),
      result: project.result || '',
      featured: Boolean(project.featured),
      order: Number(project.order || 0)
    };
  };

  const same = (a, b) => !b || String(a).toLowerCase() === String(b).toLowerCase();

  const renderMedia = project => {
    if (project.video && /\.(mp4|webm|ogg)(\?.*)?$/i.test(project.video)) {
      return `<video src="${escapeHtml(project.video)}" controls preload="metadata"${project.image ? ` poster="${escapeHtml(project.image)}"` : ''}></video>`;
    }
    if (project.video && /youtube\.com\/embed|youtube-nocookie\.com\/embed|player\.vimeo\.com\/video/i.test(project.video)) {
      return `<iframe src="${escapeHtml(project.video)}" title="${escapeHtml(project.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    if (project.image) {
      const alt = escapeHtml(project.alt || project.title);
      const img = src => `<img src="${escapeHtml(src)}" alt="${alt}" loading="lazy">`;
      return project.fallback
        ? `<picture><source srcset="${escapeHtml(project.image)}" type="image/webp">${img(project.fallback)}</picture>`
        : img(project.image);
    }
    return '<div class="project-placeholder" aria-hidden="true"></div>';
  };

  const renderFigure = project => {
    const details = [project.client, project.year, project.tools].filter(Boolean).join(' • ');
    const link = project.externalUrl
      ? `<a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener" class="demo-btn">${escapeHtml(project.linkLabel || 'View Project')}</a>`
      : '';
    return `
      <figure class="project-card"${project.embed ? ` data-video="${escapeHtml(project.embed)}"` : ''}>
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
    if (!list.length) return;
    container.dataset.r2Loaded = 'true';
    container.innerHTML = list.map(p => (mode === 'featured' ? renderFeatureCard(p) : renderFigure(p))).join('');
  };

  // Click a thumbnail that has a video to open it in the lightbox (animations page).
  const initLightbox = () => {
    const box = document.getElementById('lightbox');
    const frame = document.getElementById('lightbox-video');
    const closeBtn = document.getElementById('lightbox-close');
    if (!box || !frame || !closeBtn) return;
    const close = () => { box.classList.remove('active'); frame.src = ''; };
    document.addEventListener('click', e => {
      const figure = e.target.closest('figure[data-video]');
      if (!figure) return;
      const link = figure.dataset.video;
      box.classList.add('active');
      frame.src = link + '?autoplay=1&rel=0';
      frame.onerror = () => { window.open(link.replace('/embed/', '/watch?v='), '_blank'); close(); };
    });
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', e => { if (e.target === box) close(); });
  };

  document.addEventListener('DOMContentLoaded', async () => {
    initLightbox();
    const containers = document.querySelectorAll('[data-projects]');
    if (!containers.length) return;
    try {
      const data = await load();
      const projects = data.projects.map(normalizeProject);
      containers.forEach(c => render(c, projects));
    } catch (error) {
      console.warn('Portfolio data unavailable:', error);
      containers.forEach(c => { c.innerHTML = '<p>Projects could not be loaded right now.</p>'; });
    }
  });
}());
