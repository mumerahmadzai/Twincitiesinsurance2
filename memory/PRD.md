# Twin Cities Insurance — PRD

## Original Problem Statement
Insurance brokerage landing page for **Twin Cities Insurance** (Principal Agent
Muhammad Umar Ahmadzai, 612-222-1749, mumerahmadzai@gmail.com), Minneapolis &
Saint Paul metro. The May-2026 session imported the existing repo, then made
the site truly publish-ready: real email notifications, anti-spam, hardened
secrets, legal pages, SEO. Stack: React + Three.js + Framer Motion + Tailwind,
FastAPI + MongoDB + JWT, Resend for transactional email.

## Architecture
- **Backend** (`/app/backend/server.py`)
  - `GET  /api/`              service status
  - `GET  /api/health`        Mongo ping
  - `POST /api/auth/login`    admin email/password → JWT (12 h)
  - `GET  /api/auth/me`       current admin (auth)
  - `POST /api/quotes`        public quote submit
      • honeypot field `website` → silent discard
      • per-IP sliding window rate limit (20/hr, configurable)
      • fire-and-forget Resend email to admin (throttled w/ retry on 429)
      • optional customer confirmation email when `SEND_CUSTOMER_CONFIRMATION=true`
  - `GET  /api/quotes`        admin list (auth)
  - `GET  /api/quotes/{id}`   single (auth)
  - `POST /api/quotes/{id}/share-link`  carrier tokenized URL (auth, 72 h)
  - `GET  /api/share/{token}`  public carrier-safe view
- **Frontend**
  - `/`              Landing (Hero3D + Portfolio + QuoteModal w/ honeypot)
  - `/admin/login`   JWT login
  - `/admin`         Quote pipeline + CSV export + share-link generator
  - `/share/:token`  Public carrier view
  - `/privacy`       Minnesota-compliant privacy policy
  - `/terms`         Minnesota-compliant terms of service
- **Static SEO**
  - `/sitemap.xml`, `/robots.txt`, `og:` / `twitter:` meta,
    schema.org `InsuranceAgency` JSON-LD, real favicon

## Implemented (2026-05 session)
- Resend transactional email integration (real key) with semaphore throttle
  + retry-on-429 (`Email sent to mumerahmadzai@gmail.com (id=...)` confirmed)
- Anti-spam: hidden `website` honeypot + per-IP sliding window rate limit
- Hardened secrets: regenerated `JWT_SECRET`, set strong admin password
- Privacy + Terms pages (MN-compliant)
- SEO: meta, OpenGraph, Twitter Card, schema.org `InsuranceAgency`, sitemap,
  robots, favicon
- Analytics scaffolding (GA4 + Plausible) auto-activate when env vars are set
- Google API key stored as `GOOGLE_API_KEY` for future Maps/Places usage
- 25/25 backend pytest tests passing on live preview URL

## Pending before production launch
1. **Deploy** via the Emergent **Deploy** button (or Vercel/Railway).
2. Provision **MongoDB Atlas** cluster + set `MONGO_URL` in deployment env.
3. Buy/verify domain (e.g. `twincitiesinsurance.com`) and:
   - point DNS to the deployment
   - verify the domain in Resend → flip `RESEND_FROM` to `quotes@<domain>`
   - flip `SEND_CUSTOMER_CONFIRMATION=true`
4. **Rotate** the Resend key that was pasted in chat.
5. **Restrict** the Google API key in Google Cloud Console (HTTP referrer +
   API restrictions).
6. Optionally turn on analytics by setting `REACT_APP_GA4_ID` or
   `REACT_APP_PLAUSIBLE_DOMAIN` in frontend `.env`.

## Backlog
### P1
- Quote status transitions (received → quoted → bound) + agent notes
- Reply-to in admin notifications set to the customer's email (one-click reply)
### P2
- Stripe "Bind Now" deposit checkout for limousine fleet quotes
- Carrier appointment badges / testimonials on landing
- Persist Resend outbox to Mongo for guaranteed delivery on burst > 3 req/sec
- Move rate-limit bucket to Redis when scaling beyond single replica
