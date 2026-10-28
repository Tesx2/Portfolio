# Vincent Mwangi Portfolio

A responsive, multi-page portfolio website for **Vincent Mwangi**, a graphic designer, animator and motion designer based in Kenya. It showcases posters, logos, motion graphics, animations and web projects, and is built to convert visitors (clients, agencies, NGOs, HR teams) into briefs.

Live site: https://vinanimator.dpdns.org/

## Features

- Responsive layout with a mobile hamburger menu and active-page highlighting
- Category pages for each type of work, with captioned galleries
- Video lightbox for animations (YouTube embeds)
- Interactive software proficiency carousel
- Contact form (Formspree) with bot protection and a success toast
- Floating WhatsApp button and "Send a Brief" calls to action
- Downloadable CV
- SEO setup: meta tags, Open Graph and Twitter cards, `sitemap.xml`, `robots.txt`, and `llm.txt` for AI crawlers
- Optional Cloudflare R2 content: galleries load from a `index.json` index in your bucket, and fall back to the static HTML if R2 is not configured

## Tech Stack

| Area | Details |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Icons and fonts | Font Awesome 6.5 (cdnjs), Montserrat, Inter |
| Forms | Formspree |
| Hosting | Cloudflare Pages (`_headers`, `.assetsignore`) |
| Media and content (optional) | Cloudflare R2 (`index.json` index + media files) |

## Project Structure

```
Portfolio/
├── index.html                  # Home: hero, about, case studies, services, contact
├── work.html / client.html / project.html  # Data-driven Work, client and project pages
├── posters.html                # Posters and promotional designs
├── logos.html                  # Logo and brand identity work
├── motion-graphics.html        # Logo animations, lower thirds, news bumpers
├── animations.html             # Character and story animations
├── websites.html               # Web projects
├── assets/
│   ├── css/brand-refresh.css   # Brand system styles
│   ├── js/                     # r2-config.js (bucket URL), r2-portfolio.js (loader)
│   ├── data/projects.sample.json  # Example shape of index.json
│   ├── posters/ logos/ motion_graphics/ animations/ website/
│   ├── icons/                  # Software icons for the proficiency carousel
│   └── profile_image/
├── admin-worker/               # Private admin app (Cloudflare Worker + Access login), see its README
├── project_info.json           # Machine-readable project summary
├── PORTFOLIO_UPGRADE_STATUS.md # Improvement tracker
├── sitemap.xml / robots.txt / llm.txt / _headers
└── vincent mwangi cv 2026.pdf
```

## Brand System

| Role | Value |
| --- | --- |
| Primary (dark blue/teal) | `#2F495A` |
| Secondary (bright green) | `#27AE60` |
| Accent (cyan) | `#00C2A8` |
| Background | `#FFFFFF` |
| Light background | `#F5F7F8` |
| Text (charcoal) | `#222222` |
| Headings | Montserrat Bold |
| Body | Inter |
| Buttons | Montserrat SemiBold |

## Running Locally

This is a static site with no build step.

```bash
git clone https://github.com/Tesx2/Portfolio.git
cd Portfolio

# Option 1: open index.html directly in a browser
# Option 2: serve it locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

**Cloudflare Pages:** connect the repository, leave the build command empty, and set the build output directory to the repository root (`/`). Files listed in `.assetsignore` are excluded from upload. Custom domain: https://vinanimator.dpdns.org

## Adding Portfolio Work

**Manually:** add the image or video to the matching `assets/<category>/` folder, then add a gallery item with a title and caption to the matching category page. Prefer `.webp` for posters where possible.

**Via Cloudflare R2 (no HTML edits):**

1. In your R2 bucket, upload media under folders such as `posters/`, `logos/`, `motion_graphics/`.
2. Upload a `index.json` to the bucket root. See `assets/data/projects.sample.json` for the shape. Media paths can be bucket keys (e.g. `posters/foo.webp`) or full URLs. Each project has a `category` (Posters, Logos, Motion Graphics, Animations, Websites), and optional `subcategory`, `featured`, and `order`.
3. Make the bucket publicly readable (custom domain such as `media.vinanimator.dpdns.org`, or the `r2.dev` URL) and add a CORS rule allowing `GET` from `https://vinanimator.dpdns.org`.
4. Set `baseUrl` in `assets/js/r2-config.js` to that public URL and redeploy.

Pages mark their galleries with `data-projects` (plus `data-category`, `data-subcategory`, `data-featured`, `data-limit`). If the bucket is unset, unreachable, or has no matching projects, the existing static galleries stay in place.

## Work, Clients and Projects

`work.html` (all projects with Category and Client filters), `client.html?c=<slug>` and `project.html?p=<slug>` are generated from one file, `index.json`, in the R2 bucket. See `assets/data/index.sample.json` for the format. Add `?demo=1` to a page URL to preview with the sample data.

- A **client** has `slug`, `name`, `logo`, `about`, and `showName`. If `showName` is `false`, the client's name, logo and page are hidden and projects show `publicLabel` (e.g. "NGO / Humanitarian") instead.
- A **project** has `slug`, `title`, `client` (the client slug), `category` and optional `subcategory` (any text, new ones appear automatically), `year`, `summary`, `cover`, `images`, `deliverables`, `tools`, `featured`, `order`, and optional `status: "draft"` to hide it.
- Media paths are bucket keys such as `clients/kenya-red-cross/world-food-day/rollup.webp`.

### Categories and subcategories

`index.json` can include a `categories` list that sets the order and the choices offered when uploading:

```json
"categories": [
  { "name": "Banners", "subcategories": ["Street banners", "Media banners", "Roll-up banners"] },
  { "name": "T-Shirts" }
]
```

When a category is selected on the Work page, its projects are grouped under a heading for each subcategory (in the order above), with a second row of filter chips. Projects with no subcategory go last under "Other". Client pages group the same way. Add `?category=Banners&sub=Street%20banners` to a Work page URL to link straight to one type.

### Media items

A project's `media` array can mix any of these, in order. The first image (or a video `poster`, or a PDF's first page) becomes the card cover unless `cover` is set.

```json
{ "type": "image", "src": "clients/x/p/banner.webp", "width": 3000, "height": 2000,
  "srcset": [{ "w": 480, "src": "..-480.webp" }, { "w": 960, "src": "..-960.webp" }] }
{ "type": "video", "src": "clients/x/p/reel.mp4", "poster": "clients/x/p/reel.webp", "ratio": "9:16" }
{ "type": "embed", "url": "https://www.youtube.com/watch?v=..." }
{ "type": "pdf", "title": "Brand guide", "src": "clients/x/p/guide.pdf", "pages": ["clients/x/p/p1.webp", "..."] }
```

- Grid covers: shown whole, never cropped. The grid is a masonry layout where each card takes the cover's real shape, limited to between 1:1.67 (tall) and 2:1 (wide). Anything more extreme, such as a 1:3 roll-up or a 4:1 strip, is shown complete on a soft grey backing. Store each image's `width` and `height` (or `coverWidth` and `coverHeight` for a custom `cover`) so the layout doesn't shift while loading; if they're missing, the page measures the image when it loads.
- Ratios: `16:9`, `9:16`, `1:1`, `4:5` or any `w:h`. Wide media is full width, portrait and square media are capped (380px and 520px) and sit side by side, and nothing is stretched or cropped.
- Embeds recognised automatically: YouTube (including Shorts), Vimeo, Instagram reels and posts, TikTok and Facebook. The ratio is detected from the link. Other links show a "Watch video" button.
- PDFs: `pages` are images of each page, so they load fast and look the same on every phone. The viewer shows 4 pages with a "Show all" button, plus Open PDF and Download buttons.

## Project Page Content Model

Each project should tell a story:

1. Hero image or video
2. Client
3. Challenge
4. Solution
5. Process
6. Final deliverables
7. Gallery
8. Related projects

Motion graphics projects also include: video, project summary, software used, storyboard, frames, final video, and credits.

## Roadmap

Tracked in `PORTFOLIO_UPGRADE_STATUS.md`. Highlights:

- Add detailed captions to every remaining poster
- Build individual detail pages for the four featured case studies
- Create the R2 bucket's public URL and CORS rule, upload `index.json`, and set `baseUrl`
- Replace unclear project titles with client-friendly names
- Add measurable results where real numbers exist
- Full mobile test pass once R2 content is connected

## Contact

- Portfolio: https://vinanimator.dpdns.org/
- WhatsApp, email and LinkedIn links are on the contact section of the site
- CV: `vincent mwangi cv 2026.pdf`

&copy; Vincent Mwangi. All rights reserved. Portfolio work belongs to the respective clients and owner.
