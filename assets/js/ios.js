(function () {
  const header = document.querySelector('header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.getElementById('menu-toggle'), nav = document.getElementById('nav-menu');
  if (toggle && nav) {
    const open = () => nav.classList.contains('active'), close = () => nav.classList.remove('active');
    new MutationObserver(() => toggle.setAttribute('aria-expanded', String(open()))).observe(nav, { attributes: true, attributeFilter: ['class'] });
    addEventListener('keydown', e => { if (e.key === 'Escape' && open()) { close(); toggle.focus(); } });
    document.addEventListener('click', e => { if (open() && !nav.contains(e.target) && !toggle.contains(e.target)) close(); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  }

  // Active link: separate pages by file name; home-page anchors follow the section in view.
  const links = [...document.querySelectorAll('#nav-menu a')], here = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => { if ((a.getAttribute('href') || '') === here) a.setAttribute('aria-current', 'page'); });
  const anchors = links.filter(a => (a.getAttribute('href') || '').startsWith('#'));
  if (anchors.length && 'IntersectionObserver' in window) {
    const set = id => anchors.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + id));
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && set(e.target.id)), { rootMargin: '-40% 0px -55% 0px' });
    anchors.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
  }
})();
