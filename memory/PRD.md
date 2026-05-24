# Twin Cities Insurance — PRD

## Original Problem Statement
Import the existing project from the GitHub repo `mumerahmadzai/Twincitiesinsurance`
into this Emergent workspace and bring services up.

Underlying app: Responsive insurance brokerage landing page for **Twin Cities
Insurance** (principal: Muhammad Umar Ahmadzai, phone 612-222-1749, email
mumerahmadzai@gmail.com) serving the Twin Cities (Minneapolis & Saint Paul)
Metro. Stack: React Three Fiber, Framer Motion, Tailwind, FastAPI, MongoDB,
JWT admin auth + tokenized carrier share links.

## User Choices (locked 2026-02)
- Quote routing: **MongoDB-only storage** (no SMTP/email yet).
- 3D limousine: **stylized low-poly using Three.js primitives** (no external GLB).
- Quote persistence: every submission stored in MongoDB.
- Admin auth: JWT, 12 h access TTL, 72 h share TTL.

## Architecture
- **Backend** (`/app/backend/server.py`)
  - `GET /api/` — service status
  - `GET /api/health` — Mongo ping
  - `POST /api/auth/login` — admin email/password → JWT
  - `GET /api/auth/me` — current admin
  - `POST /api/quotes` — public quote submission
  - `GET /api/quotes` — admin list (auth required)
  - `GET /api/quotes/{id}` — single quote (auth required)
  - `POST /api/quotes/{id}/share-link` — issue tokenized carrier link
  - `GET /api/share/{token}` — public carrier-safe view
- **Frontend**
  - `/` Landing (Hero3D + Portfolio + QuoteModal + Footer)
  - `/admin/login` — JWT login
  - `/admin` — quote pipeline + share-link generator
  - `/share/:token` — public carrier view

## Implemented (imported 2026-05)
- Full repo restored from GitHub into `/app`
- Backend `.env` reconstructed with `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  (protected `MONGO_URL` / `DB_NAME` preserved)
- Python deps installed, yarn deps installed
- Admin user seeded on startup (`mumerahmadzai@gmail.com`)
- Smoke-tested: `/api/`, `/api/health`, `/api/quotes` POST, `/api/auth/login`,
  authenticated `/api/quotes` list — all 200 OK
- Frontend compiled and served at the preview URL (200 OK)

## Backlog
### P1
- Email delivery (Resend / SendGrid) on `POST /api/quotes`
- Admin "mark as quoted / bound" status transitions + agent notes
- SEO meta + OpenGraph card + `InsuranceAgency` schema.org markup
### P2
- Stripe "Bind Now" deposit checkout
- Carrier appointment badges / testimonials
- E&O / W-9 document upload endpoint for the admin

## Next Tasks
1. Confirm with user whether they want any new features built on top of the
   imported codebase, or just a clean import.
2. Wire an email provider (Resend) once a key is supplied.
3. Add SEO + OG metadata.
