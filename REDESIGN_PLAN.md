# Redesign plan

**Goal:** an editorial, premium portfolio for graphic design, motion graphics and animation, following the reference (serif headings, clean sans text, generous space, refined cards), with all content living in data and all code clean.

## Rules (check every phase against these)
1. Keep every piece of content and every feature: contact form, WhatsApp, CV, SEO, admin data.
2. Minimal. No filler text, no decoration for its own sake.
3. Responsive from 360px to 1440px, no sideways scroll.
4. Content is data, not HTML. One stylesheet, no inline CSS.
5. Nothing moves to the next phase until the current one is verified.

## Design direction (from the reference)
- **Type:** serif display headings (Playfair Display) + Inter for text. Sentence case. One italic accent word in the hero only.
- **Colour:** deep teal ink `#0f2b30` (hero, CTA banner, footer), cream `#f6f3ec` (page), white cards, soft sage `#b7d58a` for buttons on dark, brand green `#1a8a47` for buttons on light.
- **Layout:** dark hero (headline, two buttons, rounded media plate) > strengths strip (4 items, hairline dividers) > Selected Work (4 cards) > categories row > "Start a project" banner > real-numbers row (only if the data supports it) > dark footer.
- **Cards:** 16px corners, hairline border, no heavy shadow, images shown whole, 2px lift on hover.
- **Motion:** fades and hover only. Respect reduced motion.

## Phases
- [ ] **0. Safety net:** tag the current site `pre-redesign`, work on a `redesign` branch so Cloudflare builds a preview URL. Rollback = revert to the tag.
- [x] **1. Inventory:** 9 pages with about 45 KB of duplicated inline CSS; 3 extra stylesheet layers; 45 hardcoded gallery items (24 posters, 6 logos, 5 motion, 6 animations, 4 websites); hardcoded home cards (5 featured, 5 categories, 4 case studies, 6 clients); 22 unreferenced asset files; 17 MB of profile images; 46 MB motion folder.
- [ ] **2. Content to data:** move every hardcoded item into `assets/data/seed.json` (title, caption, category, files). The loader merges it with admin data. Verify: item counts before and after match.
- [ ] **3. One design system:** `site.css` with tokens and components. Delete `brand-refresh.css`, `ios.css`, per-page inline CSS and `r2-portfolio.js`.
- [ ] **4. Pages:** redesign Home, then Work, client and project. The five category pages become small redirects to `work.html?category=...` so old links keep working.
- [ ] **5. Clean-up:** remove unreferenced files (after you confirm the list), convert heavy images to WebP, delete dead code, update README, sitemap and llm.txt.
- [ ] **6. QA:** parity check, no overflow at 360/768/1440, all links, form, WhatsApp and CV working, keyboard focus, contrast, page weight, screenshots reviewed with you.
- [ ] **7. Release:** your approval on the preview, merge, revoke the GitHub token.

## Decisions (defaults, change any)
1. Fonts: Playfair Display + Inter.
2. Palette: the reference's forest green and cream, adapted to your teal brand.
3. Automatic dark mode is dropped. The editorial look is deliberately two-tone, and last turn's dark theme would fight it.
4. "Remove hardcoded content" means moved into data. Nothing disappears.
5. Old category pages redirect, they are not deleted.
6. No invented numbers or testimonials. The numbers row uses real counts or is left out.

## Out of scope
Admin panel redesign. New copy or new content.
