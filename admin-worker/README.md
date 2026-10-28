# Portfolio Admin

A private admin app (clients, projects, uploads) that publishes to the R2 bucket. It is a separate Worker and is never part of the public site (`admin-worker` is listed in `.assetsignore`).

## Security

- **Login:** [Better Auth](https://github.com/better-auth/better-auth) with email and password. Sign-up is switched off; the single admin account is created once with a setup code.
- **Session:** signed out **1 hour** after login (no sliding extension). The admin page also signs you out after 30 minutes of inactivity.
- **Forgot password:** the login page sends a 15-minute reset link to the admin email only. Resetting signs out every other session.
- **Brute-force limits:** 5 sign-in attempts per 5 minutes and 3 reset requests per 10 minutes. Passwords need 12+ characters and are hashed with PBKDF2 (100,000 rounds, the Workers maximum).
- **Other protections:** only `ADMIN_EMAIL` is ever accepted, strict same-site cookies, same-origin and header checks on every change, upload type and size limits (no SVG), and file names restricted to `clients/...`.
- **Private data:** drafts, hidden clients and the trash live in a second, private bucket. Only published work goes into the public `index.json`.

## One-time setup

1. **Buckets:** create the private bucket `vinanimator-portfolio-private` (leave it private) and add a lifecycle rule on prefix `trash/` to delete after 30 days.
2. **Database:** `npx wrangler d1 create portfolio-admin`, paste the id into `wrangler.jsonc`, then `npx wrangler d1 execute portfolio-admin --remote --file=schema.sql`.
3. **Settings:** in `wrangler.jsonc` set `ADMIN_EMAIL`, `ADMIN_ORIGIN` and `MAIL_FROM`.
4. **Secrets:** `npx wrangler secret put BETTER_AUTH_SECRET` (a random 32+ character string) and `npx wrangler secret put SETUP_TOKEN` (a one-time setup code).
5. **Email for reset links** (pick one):
   - Cloudflare Email Routing: enable it for the domain and verify the admin address as a destination. `MAIL_FROM` must be an address on that domain.
   - Resend: `npx wrangler secret put RESEND_API_KEY` and use a sender on a domain verified in Resend.
6. **Deploy:** `npm install && npx wrangler deploy`, then add the custom domain `admin.vinanimator.dpdns.org` to the Worker.
7. **Create the admin:** open `https://admin.vinanimator.dpdns.org`. The login page shows "First-time setup". Enter the setup code and a password. After that, the setup code does nothing.
8. **Public site:** set `baseUrl` in `assets/js/r2-config.js` to `https://media.vinanimator.dpdns.org`.

Optional extra layer: put a Cloudflare Access policy in front of the admin domain.

## Limits in this version

- Uploads go through the Worker, so each file must be 100 MB or less. Use a YouTube or Vimeo link for longer videos.
- PDFs are uploaded as the original file. Rendering page images (for the in-page viewer) is not built yet.
- No drag-to-reorder; new projects appear first.
