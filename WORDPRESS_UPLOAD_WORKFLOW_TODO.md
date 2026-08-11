# WordPress Upload Workflow To-Do

Goal: use WordPress as the place where new portfolio creations are uploaded, so the website does not need a GitHub push every time a new poster, logo, animation, motion graphic, or website project is added.

## Recommended Direction

Keep the current portfolio as the public front-end for now, and use WordPress as a headless CMS behind it.

Current selected direction:

- Use free WordPress.com.
- Upload creations as normal WordPress posts.
- Use normal post categories for Posters, Logos, Motion Graphics, Animations, Websites, Publications, and Video Editing.
- Use the `Featured` tag for homepage projects.
- Do not rely on custom plugins because free WordPress.com does not allow plugin uploads.

This means:

- WordPress becomes the admin dashboard where creations are uploaded.
- The portfolio website fetches project data from the WordPress REST API.
- GitHub is only used when changing the site design, layout, or code.
- New work can be added by logging into WordPress, filling a project form, and publishing.

This is better than rebuilding the whole site immediately because it protects the current design while solving the upload problem first.

## Phase 1: Decide The WordPress Setup

Choose where WordPress will live.

Options:

- Subdomain: `cms.yourdomain.com`
- Folder on main domain: `yourdomain.com/cms`
- Separate temporary domain from hosting provider

Recommended:

- Use `cms.yourdomain.com` if you have a domain.
- Use a hosting provider with normal WordPress support.
- Keep the portfolio front-end on Netlify until the WordPress content workflow is stable.

Need from Vincent:

- WordPress admin URL
- WordPress username with admin access
- Public site URL
- Confirmation whether the current portfolio should stay on Netlify

## Phase 2: Create The WordPress Content Model

Free WordPress.com content model:

```text
Normal WordPress Posts
```

Paid/self-hosted content model:

```text
Portfolio Projects
```

Use categories instead of many separate post types.

Recommended categories:

- Posters
- Logos
- Motion Graphics
- Animations
- Websites
- Publications
- Video Editing

Recommended project fields:

- Project title
- Short summary
- Category
- Featured image
- Gallery images
- Video URL or uploaded video
- Client name
- Subcategory, mainly for animation sections
- Project year
- Role
- Tools used
- Challenge
- Solution
- Deliverables
- Result or use case
- External link
- Featured project toggle
- Display order

Recommended plugin for fields:

- Advanced Custom Fields, also called ACF

Current implementation note:

- For the free path, do not use ACF or the custom plugin.
- The custom plugin exists only as a future paid/self-hosted upgrade path.

## Phase 3: Install Required WordPress Plugins

Free WordPress.com path:

- Install no plugins.
- Use posts, categories, tags, featured images, and post content labels.

Paid/self-hosted path:

Install these only if you later move away from free WordPress.com:

- Advanced Custom Fields: adds custom fields for project details.
- Custom Post Type UI: creates the Portfolio Projects post type.
- Rank Math SEO: manages SEO titles and descriptions.
- Fluent Forms: replaces or supports the contact form.
- LiteSpeed Cache: only if the hosting supports LiteSpeed.
- Enable Media Replace: useful when updating portfolio images.

Current implementation note:

- `Custom Post Type UI` is no longer required if using the included `vince-portfolio-projects` plugin.
- `Advanced Custom Fields` is optional because the plugin includes a simple Project Details admin box.
- The included plugin cannot be uploaded on free WordPress.com.

Optional later:

- ShortPixel or Imagify for image compression.
- Redirection for URL management.

## Phase 4: Create The REST API Output

The front-end needs clean JSON from WordPress.

Free WordPress.com endpoint:

```text
/wp-json/wp/v2/posts?_embed=1
```

The front-end reads:

- Post title as project title.
- Post excerpt/content as summary.
- Featured image as project image.
- Post category as portfolio category.
- `Featured` tag as homepage featured flag.
- Labeled post lines such as `Client:`, `Tools:`, `Video:`, and `External URL:`.

Target API shape:

```json
{
  "id": 123,
  "title": "Langata Cleanup Poster",
  "slug": "langata-cleanup-poster",
  "category": "Posters",
  "summary": "Community event poster designed for quick social media reading.",
  "featuredImage": "https://cms.example.com/wp-content/uploads/poster.jpg",
  "gallery": [],
  "videoUrl": "",
  "client": "Community Cleanup Campaign",
  "year": "2026",
  "role": "Poster design",
  "tools": ["Illustrator", "Photoshop"],
  "challenge": "...",
  "solution": "...",
  "deliverables": "...",
  "result": "...",
  "externalUrl": "",
  "featured": true,
  "order": 1
}
```

Implementation options:

- Use default WordPress REST API and ACF REST output.
- Or create a small custom WordPress plugin that exposes `/wp-json/vince/v1/projects`.

Recommended:

- Use a small custom plugin later, because it gives the website cleaner and more stable data.

Current implementation:

- A first custom plugin has been created at `wordpress-plugins/vince-portfolio-projects/`.
- It registers a `Portfolio Projects` post type.
- It registers a `Project Categories` taxonomy.
- It auto-creates the standard categories.
- It adds admin fields for project details.
- It includes a `subcategory` field for sections like 2D Animations, Stopmotion Animations, and 3D Animations.
- It includes `gallery_urls` for extra project images.
- It adds admin list columns for category, featured status, and project year.
- It adds CORS headers for `/wp-json/vince/v1/projects`.
- It exposes `/wp-json/vince/v1/projects`.
- This plugin is not needed for the selected free WordPress.com path.

## Phase 5: Connect The Current Website To WordPress

Add a new front-end JavaScript file:

```text
assets/js/wp-portfolio.js
```

Responsibilities:

- Fetch projects from WordPress.
- Filter projects by category.
- Render project cards into existing galleries.
- Show loading and empty states.
- Fall back to current hardcoded gallery items if WordPress is unavailable.

Current implementation:

- `assets/js/wp-portfolio.js` has been created.
- `assets/js/wp-config.js` has been created as the single place to set the WordPress URL.
- `assets/data/wp-projects.sample.json` has been created for local preview testing.
- `wordpress-preview.html` has been created as a safe preview page for WordPress-style project cards.
- `assets/data/wpcom-posts.sample.json` has been created for free WordPress.com post preview testing.
- `wordpress-com-preview.html` has been created for the selected free WordPress.com path.
- It does nothing while `apiBase` is blank.
- It can use `mockDataUrl` for preview testing when `apiBase` is blank.
- Once `apiBase` is set, it fetches WordPress projects and replaces marked gallery containers.
- It now supports `source: 'wpcom-posts'` for free WordPress.com posts.
- If the WordPress request fails or returns no matching projects, existing hardcoded gallery items remain visible.

Pages to connect:

- `index.html`: featured projects and portfolio categories. Status: front-end hook added.
- `posters.html`: only Poster category. Status: front-end hook added.
- `logos.html`: only Logos category. Status: front-end hook added.
- `motion-graphics.html`: only Motion Graphics category. Status: front-end hook added.
- `animations.html`: only Animations category. Status: front-end hooks added.
- `websites.html`: only Websites category. Status: front-end hook added.

## Phase 6: Update HTML Gallery Containers

Each gallery page should have a container that JavaScript can target.

Example:

```html
<div class="gallery" data-wp-projects data-category="Posters">
  Existing fallback items stay here.
</div>
```

This lets the site work even before WordPress is ready.

Current implementation:

- Gallery containers now use `data-wp-projects`.
- Category pages now use `data-category`.
- Homepage featured grid now uses `data-render="featured"`, `data-featured="true"`, and `data-limit="5"`.
- Each page loads `assets/js/wp-config.js` and `assets/js/wp-portfolio.js`.
- `assets/js/wp-config.js` has `apiBase` currently blank.

## Phase 7: Upload The First Test Projects

Add 5 test projects in WordPress:

- Langata Cleanup Poster
- Amari Production Logo
- 7 Media Logo Animation
- Butterfly Life Cycle Animation
- Zipton Tours Website

Current implementation:

- A first upload checklist exists at `wordpress-plugins/vince-portfolio-projects/UPLOAD_CHECKLIST.md`.
- A content template exists at `wordpress-plugins/vince-portfolio-projects/first-projects-template.csv`.

For each one, fill:

- Title
- Category
- Featured image
- Short summary
- Client/project name
- Tools
- Result/use case

## Phase 8: Test The Full Workflow

Test as a real client would see it:

- Open `wordpress-preview.html` first to confirm WordPress-style cards render from sample JSON.
- For the selected free path, open `wordpress-com-preview.html` first to confirm normal WordPress.com posts render from sample JSON.
- Upload a new project in WordPress.
- Publish it.
- Refresh the portfolio page.
- Confirm the new project appears.
- Confirm mobile layout works.
- Confirm images load fast.
- Confirm video links open correctly.
- Confirm old hardcoded fallback does not break.

## Phase 9: Decide Whether To Fully Move To WordPress

After the upload workflow works, choose one:

- Keep the current front-end on Netlify and WordPress as CMS.
- Rebuild the full public website as a WordPress theme.

Recommended for now:

- Keep Netlify front-end plus WordPress CMS.

Reason:

- It gives fast performance.
- It keeps the current custom design.
- It avoids a full rebuild.
- It solves the upload problem first.

## Exact Resume Prompt

Use this later:

```text
Continue the WordPress upload workflow. Start by creating the front-end WordPress fetch layer with fallback gallery items, then mark the existing gallery containers with data-category attributes.
```

## Current Status

- Portfolio is still a static HTML site.
- WordPress is not connected to a live URL yet.
- `README.md` already mentions a WordPress migration blueprint.
- `assets/js/wp-portfolio.js` now exists.
- `assets/js/wp-config.js` now exists.
- Gallery containers are marked for WordPress rendering.
- A custom WordPress plugin exists at `wordpress-plugins/vince-portfolio-projects/`.
- No WordPress API URL has been added yet.
- Next technical step is to create a free WordPress.com site, create normal post categories, publish test posts, then set `apiBase` in `assets/js/wp-config.js`.

See `WORDPRESS_COM_FREE_SETUP.md`.

## Local Preview Mode

To preview the WordPress-rendered layout before the real WordPress site exists:

1. Open `wordpress-preview.html`.
2. Confirm the sample projects render into the featured grid and category galleries.
3. Edit `assets/data/wp-projects.sample.json` if you want to preview more projects.

Do not set `mockDataUrl` in `assets/js/wp-config.js` for the live portfolio unless you intentionally want local sample data to replace the hardcoded galleries.

## Live Switch-Over

When WordPress is installed and the plugin is active:

1. Upload the first test projects.
2. Visit `https://your-wordpress-site.com/wp-json/vince/v1/projects`.
3. Confirm JSON appears in the browser.
4. Edit `assets/js/wp-config.js`.
5. Set:

```js
apiBase: 'https://your-wordpress-site.com'
```

6. Keep `mockDataUrl` blank.
7. Refresh the portfolio pages.
