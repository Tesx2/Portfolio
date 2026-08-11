# Portfolio Upgrade Status

This file tracks the portfolio improvements requested from the client/HR review checklist.

## Completed Locally

- Homepage positioning sharpened for clients, agencies, NGOs, HR, and creative teams.
- About section rewritten with training, strengths, work style, reliability, and best-fit clients.
- CV visibility improved in the nav, hero, About section, contact cards, and footer.
- Contact conversion improved with `Send a Brief`, WhatsApp brief links, email subject, LinkedIn HR framing, project type field, and deadline field.
- Mobile hamburger responsiveness repaired on the homepage.
- About/Services overlap fixed by correcting image and grid behavior.
- Homepage case-study section added for Amari Production Logo, Langata Cleanup Poster, 7 Media Logo Animation, and Zipton Tours Website.
- Stronger captions added to selected posters, logos, motion graphics, and website projects.
- Shared gallery caption styling added so title/description captions remain readable.
- Free WordPress.com CMS workflow prepared using normal posts, categories, tags, featured images, and the built-in posts API.
- WordPress.com free setup guide added in `WORDPRESS_COM_FREE_SETUP.md`.
- WordPress.com preview page added in `wordpress-com-preview.html`.

## Still Requires User Action

- Create the WordPress.com post categories:
  - Posters
  - Logos
  - Motion Graphics
  - Animations
  - Websites
  - Publications
  - Video Editing
- Create the `Featured` tag.
- Publish the first real WordPress.com project posts.
- Test the live API:

```text
https://vinceportfoliocms.wordpress.com/wp-json/wp/v2/posts?_embed=1
```

- Set `apiBase` in `assets/js/wp-config.js` after the WordPress.com posts are published.

## Recommended Next Local Improvements

- Add more detailed captions to every remaining poster, not only the strongest selected ones.
- Create individual detail pages for the four case studies if a deeper portfolio experience is needed.
- Replace any weak/unclear project titles with client-friendly names.
- Add measurable results later when real numbers are available.
- Test the full portfolio on mobile after the WordPress.com API is connected.
