(function () {
  const config = window.VINCE_WP_PORTFOLIO || {};
  const source = config.source || 'custom';
  const apiBase = (config.apiBase || '').replace(/\/$/, '');
  const mockDataUrl = config.mockDataUrl || '';
  const endpoint = config.endpoint || (source === 'wpcom-posts' ? '/wp-json/wp/v2/posts' : '/wp-json/vince/v1/projects');
  const defaultPerPage = Number(config.perPage || 50);

  if (!apiBase && !mockDataUrl) {
    return;
  }

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const stripHtml = value => {
    const div = document.createElement('div');
    div.innerHTML = value || '';
    return div.textContent || div.innerText || '';
  };

  const getMetaLine = (text, key) => {
    const pattern = new RegExp(`^${key}:\\\\s*(.+)$`, 'im');
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  };

  const normalizeWpPost = post => {
    const text = stripHtml(post.content?.rendered || '');
    const category = getMetaLine(text, 'Category') || (post._embedded?.['wp:term']?.[0]?.[0]?.name || '');
    const tags = post._embedded?.['wp:term']?.[1] || [];
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0] || {};
    const tagNames = tags.map(tag => tag.name);

    return {
      title: stripHtml(post.title?.rendered || post.title || 'Untitled Project'),
      category,
      subcategory: getMetaLine(text, 'Subcategory'),
      image: featuredMedia.source_url || post.featuredImage || '',
      video: getMetaLine(text, 'Video'),
      externalUrl: getMetaLine(text, 'External URL') || post.link || '',
      summary: stripHtml(post.excerpt?.rendered || '').trim() || getMetaLine(text, 'Summary'),
      client: getMetaLine(text, 'Client'),
      year: getMetaLine(text, 'Year'),
      tools: getMetaLine(text, 'Tools'),
      result: getMetaLine(text, 'Result'),
      featured: tagNames.some(tag => tag.toLowerCase() === 'featured')
    };
  };

  const normalizeProject = project => {
    if (source === 'wpcom-posts' || project._embedded || project.type === 'post') {
      return normalizeWpPost(project);
    }

    const title = project.title?.rendered || project.title || project.name || 'Untitled Project';
    const category = project.category || project.categoryName || project.type || '';
    const image = project.featuredImage || project.featured_image || project.image || project.thumbnail || '';
    const video = project.videoUrl || project.video_url || project.video || '';
    const externalUrl = project.externalUrl || project.external_url || project.link || '';
    const summary = project.summary || project.excerpt?.rendered || project.description || '';

    return {
      title,
      category,
      subcategory: project.subcategory || project.sub_category || '',
      image,
      video,
      externalUrl,
      summary,
      client: project.client || '',
      year: project.year || '',
      tools: Array.isArray(project.tools) ? project.tools.join(', ') : (project.tools || ''),
      result: project.result || '',
      featured: Boolean(project.featured)
    };
  };

  const matchesCategory = (project, category) => {
    if (!category) return true;
    return project.category.toLowerCase() === category.toLowerCase();
  };

  const matchesSubcategory = (project, subcategory) => {
    if (!subcategory) return true;
    return project.subcategory.toLowerCase() === subcategory.toLowerCase();
  };

  const matchesFeatured = (project, featured) => {
    if (!featured) return true;
    return project.featured === (featured === 'true');
  };

  const buildUrl = container => {
    if (mockDataUrl && !apiBase) {
      return mockDataUrl;
    }

    const url = new URL(apiBase + endpoint);
    const limit = container.dataset.limit || defaultPerPage;

    url.searchParams.set('per_page', limit);

    if (source === 'wpcom-posts') {
      url.searchParams.set('_embed', '1');
      return url.toString();
    }

    const category = container.dataset.category || '';
    const featured = container.dataset.featured || '';
    if (category) url.searchParams.set('category', category);
    if (featured) url.searchParams.set('featured', featured);

    return url.toString();
  };

  const renderMedia = project => {
    if (project.video && /\.(mp4|webm|ogg)(\?.*)?$/i.test(project.video)) {
      return `<video src="${escapeHtml(project.video)}" controls preload="metadata"></video>`;
    }

    if (project.video && /youtube\.com\/embed|youtube-nocookie\.com\/embed|player\.vimeo\.com\/video/i.test(project.video)) {
      return `<iframe src="${escapeHtml(project.video)}" title="${escapeHtml(project.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }

    if (project.image) {
      return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}">`;
    }

    return '<div class="wp-project-placeholder" aria-hidden="true"></div>';
  };

  const renderFigure = project => {
    const media = renderMedia(project);
    const details = [project.client, project.year, project.tools].filter(Boolean).join(' • ');
    const result = project.result ? `<span>${escapeHtml(project.result)}</span>` : '';
    const link = project.externalUrl
      ? `<a href="${escapeHtml(project.externalUrl)}" target="_blank" rel="noopener" class="demo-btn">View Project</a>`
      : '';

    return `
      <figure class="wp-project-card">
        ${media}
        <figcaption>
          <strong>${escapeHtml(project.title)}</strong>
          ${project.summary ? `<span>${escapeHtml(project.summary)}</span>` : ''}
          ${details ? `<small>${escapeHtml(details)}</small>` : ''}
          ${result}
          ${link}
        </figcaption>
      </figure>
    `;
  };

  const renderFeatureCard = project => {
    const href = project.externalUrl || '#portfolio';
    const media = renderMedia(project);

    return `
      <a href="${escapeHtml(href)}" class="card feature-card wp-project-card"${project.externalUrl ? ' target="_blank" rel="noopener"' : ''}>
        <div class="card-media">${media}</div>
        <div class="card-body">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.category || 'Portfolio')} ${project.summary ? '• ' + escapeHtml(project.summary) : ''}</p>
          <span class="btn">${project.externalUrl ? 'View Project' : 'View Work'}</span>
        </div>
      </a>
    `;
  };

  const renderProjects = (container, projects) => {
    const category = container.dataset.category || '';
    const subcategory = container.dataset.subcategory || '';
    const featured = container.dataset.featured || '';
    const mode = container.dataset.render || 'gallery';
    const filtered = projects
      .map(normalizeProject)
      .filter(project => matchesCategory(project, category))
      .filter(project => matchesSubcategory(project, subcategory))
      .filter(project => matchesFeatured(project, featured));

    if (!filtered.length) {
      return;
    }

    container.dataset.wpLoaded = 'true';
    container.innerHTML = filtered.map(project => (
      mode === 'featured' ? renderFeatureCard(project) : renderFigure(project)
    )).join('');
  };

  const loadContainer = async container => {
    try {
      container.dataset.wpLoading = 'true';
      const response = await fetch(buildUrl(container), { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`WordPress request failed: ${response.status}`);
      const data = await response.json();
      const projects = Array.isArray(data) ? data : (data.projects || data.items || []);
      renderProjects(container, projects);
    } catch (error) {
      console.warn('WordPress portfolio fallback in use:', error);
    } finally {
      delete container.dataset.wpLoading;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-wp-projects]').forEach(loadContainer);
  });
}());
