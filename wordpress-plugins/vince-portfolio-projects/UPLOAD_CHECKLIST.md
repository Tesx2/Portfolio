# First WordPress Upload Checklist

Use this after the plugin is installed and active.

## One-Time Setup

- Go to `Settings > Permalinks` and click `Save Changes`.
- Confirm `Portfolio Projects` appears in the WordPress admin menu.
- Confirm these categories exist under `Portfolio Projects > Project Categories`:
  - Posters
  - Logos
  - Motion Graphics
  - Animations
  - Websites
  - Publications
  - Video Editing

## Upload Pattern For Each Project

1. Go to `Portfolio Projects > Add New`.
2. Add the title.
3. Add the short summary in the excerpt box.
4. Select the correct project category.
5. Set a featured image.
6. Fill the `Project Details` box:
   - Client or project owner
   - Subcategory, only when needed
   - Project year
   - Your role
   - Tools used
   - External project URL
   - Video URL
   - Gallery image URLs
   - Challenge
   - Solution
   - Deliverables
   - Result
7. Tick `Featured project` only for homepage highlights.
8. Publish.
9. Open `/wp-json/vince/v1/projects` and confirm the project appears.

## First Five Test Projects

Use `first-projects-template.csv` as the content guide for:

- Langata Cleanup Poster
- Amari Production Logo
- 7 Media Logo Animation
- Butterfly Life Cycle Animation
- Zipton Tours Website

## Connect To The Static Site

After the API returns projects, edit:

```text
assets/js/wp-config.js
```

Set:

```js
apiBase: 'https://your-wordpress-site.com'
```

Then refresh the portfolio pages and confirm the WordPress projects replace the fallback gallery content.
