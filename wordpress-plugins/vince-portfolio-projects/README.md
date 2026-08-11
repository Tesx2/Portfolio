# Vince Portfolio Projects WordPress Plugin

This plugin lets WordPress act as the upload dashboard for the portfolio.

## What It Adds

- A `Portfolio Projects` post type in WordPress admin.
- A `Project Categories` taxonomy for Posters, Logos, Motion Graphics, Animations, Websites, and more.
- Default project categories created automatically.
- Project fields for client, subcategory, year, role, tools, challenge, solution, deliverables, result, external URL, video URL, gallery URLs, and featured status.
- Admin columns for category, featured status, and project year.
- CORS headers for the custom public API endpoint.
- A public REST API endpoint:

```text
/wp-json/vince/v1/projects
```

## Install

1. Zip the `vince-portfolio-projects` folder.
2. In WordPress admin, go to `Plugins > Add New > Upload Plugin`.
3. Upload the zip file and activate it.
4. Go to `Settings > Permalinks` and click `Save Changes`.
5. Confirm the default project categories were created under `Portfolio Projects > Project Categories`.

## Add A Project

1. Go to `Portfolio Projects > Add New`.
2. Add the project title.
3. Add a short summary in the excerpt field.
4. Choose a project category.
5. Add a featured image.
6. Fill the Project Details box.
7. For animations, use subcategories like `2D Animations`, `Stopmotion Animations`, or `3D Animations`.
8. Tick `Featured project` for homepage projects.
9. Publish.

## Connect The Static Portfolio

Set the WordPress URL in:

```text
assets/js/wp-config.js
```

Example:

```js
window.VINCE_WP_PORTFOLIO = {
  apiBase: 'https://cms.example.com',
  endpoint: '/wp-json/vince/v1/projects',
  perPage: 50
};
```

Replace `https://cms.example.com` with the real WordPress URL.

Leave `apiBase` blank until WordPress is ready. When blank, the current hardcoded gallery items stay visible.

For local preview without WordPress, open:

```text
wordpress-preview.html
```

That page loads:

```text
assets/data/wp-projects.sample.json
```

It lets you preview the same rendering flow before the real API exists.

## First Uploads

Use these helper files:

- `UPLOAD_CHECKLIST.md`
- `first-projects-template.csv`

They describe the first five test projects to publish before connecting the static site.
