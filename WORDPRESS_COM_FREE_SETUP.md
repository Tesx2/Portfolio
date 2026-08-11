# WordPress.com Free Setup

This is the no-payment workflow.

Use a free WordPress.com site as a simple content dashboard. You will upload creations as normal WordPress posts, then the portfolio will fetch those posts through the built-in WordPress REST API.

No custom plugin is required for this option.

## 1. Create The Free Site

From `wordpress.com/sites`:

1. Click `Create a site`.
2. Choose `Create it yourself`.
3. Pick a free WordPress.com address.
4. Use a simple/blank site.
5. Finish setup.

Example free URL:

```text
https://vinceportfolio.wordpress.com
```

## 2. Create Categories

In WordPress admin, create these post categories:

```text
Posters
Logos
Motion Graphics
Animations
Websites
Publications
Video Editing
```

Use the exact spelling because the portfolio filters by category name.

## 3. Create A Featured Tag

Create this tag:

```text
Featured
```

Use it only on posts you want to appear on the homepage featured grid.

## 4. Upload A Project As A Post

Go to:

```text
Posts > Add New
```

For each project:

1. Use the project name as the post title.
2. Add the project category.
3. Add the `Featured` tag if it should show on the homepage.
4. Set a featured image.
5. Add the project details using the template below.

## 5. Free Post Template

Paste this near the top of the post content and fill it in:

```text
Summary: Short one-sentence project summary.
Client: Client or project name.
Year: 2026
Tools: Illustrator, Photoshop
Result: Where or how the work was used.
Video:
External URL:
Subcategory:
```

For animations, use `Subcategory` only when needed:

```text
Subcategory: 2D Animations
Subcategory: Stopmotion Animations
Subcategory: 3D Animations
```

For YouTube videos, use an embed URL:

```text
Video: https://www.youtube.com/embed/B852SqCfZe4
```

For websites, use:

```text
External URL: https://example.com
```

## 6. Test The Free WordPress API

Open this URL after publishing posts:

```text
https://your-free-site.wordpress.com/wp-json/wp/v2/posts?_embed=1
```

If it works, you should see JSON text containing your posts.

## 6A. Preview Before Connecting

This repo includes a free-plan preview page:

```text
wordpress-com-preview.html
```

It loads sample WordPress.com post data from:

```text
assets/data/wpcom-posts.sample.json
```

Use this page to confirm the portfolio renderer understands normal WordPress.com posts.

## 7. Connect The Portfolio

Open:

```text
assets/js/wp-config.js
```

Set:

```js
window.VINCE_WP_PORTFOLIO = {
  source: 'wpcom-posts',
  apiBase: 'https://your-free-site.wordpress.com',
  mockDataUrl: '',
  endpoint: '/wp-json/wp/v2/posts',
  perPage: 50
};
```

Keep `mockDataUrl` blank.

## 8. Important Limits

Free WordPress.com does not allow uploading this repo's custom plugin.

That means:

- Use normal posts, not custom Portfolio Projects.
- Use normal categories, not custom taxonomies.
- Use post content labels like `Client:` and `Tools:` instead of custom fields.

This is less powerful than the plugin workflow, but it is free and works with WordPress.com.
