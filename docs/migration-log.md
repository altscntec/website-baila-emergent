# Baila Dembow — Migration Log

## Migration Date: May 2025

## What Was Migrated

### From Emergent AI → Static React App (GitHub)

#### Source of Truth
- **Before**: Emergent AI preview environment + deployed domain
- **After**: GitHub repository → deployed via Vercel/Netlify/Cloudflare Pages

---

## Changes Made

### 1. Backend Removed
- FastAPI backend + MongoDB database completely removed
- All API calls (`/api/*`) stripped from frontend code
- Features removed:
  - **Spin & Win interactive game** (required backend for email verification + prize distribution)
  - **Community signup form** (was posting to `/api/subscribe`) — replaced with static success toast
  - **Admin panel** (`/#/admin`) — deleted entirely (AdminPage.jsx removed)
  - **Discount code system** — was in MongoDB, no longer active
  - **Gallery management via API** — now static images
- Kingsday Weekender page's Spin & Win section replaced with a static "Get Your Tickets" promo CTA
- Email capture section replaced with WhatsApp community CTA

### 2. Assets Localized
All external URLs pointing to `customer-assets.emergentagent.com` replaced with local paths:
- **Branding**: `/images/branding/` (logo, bunny, OG image)
- **Event posters**: `/images/events/` (9 event posters)
- **Casita photos**: `/images/casita/` (8 event photos)
- **Videos**: `/videos/` (3 videos: hero bg, kingsnight, super bowl)

### 3. Data Exported
- MongoDB collections exported to `/export/data/`:
  - `subscribers.json` — community email subscribers
  - `discount_codes.json` — 500 Spin & Win discount codes
  - `kingsday_subscribers.json` — Kingsday game participants
  - `gallery.json` — gallery image entries
  - `status_checks.json` — health checks
- Structured data files created in `/export/data/`:
  - `events.json` — all event data
  - `media.json` — all media assets with paths
  - `navigation.json` — site routes and nav structure
  - `contact.json` — contact info, social links
  - `seo.json` — SEO metadata, pixel IDs, canonical

### 4. Dark Theme Applied
- Entire site converted to dark nightlife theme
- Smooth gradient transitions between sections
- Event cards, forms, footer all dark-themed

### 5. Dependencies Cleaned
- `axios` no longer imported anywhere
- `REACT_APP_BACKEND_URL` environment variable no longer needed
- Package can be trimmed: `axios` can be removed from `package.json`

---

## Files Removed
- `/app/frontend/src/components/pages/AdminPage.jsx`
- `/app/backend/` (entire backend directory — not needed for static deployment)

## Files Modified
- `App.js` — removed API fetching, admin route, uses static event data
- `constants.js` — all URLs converted to local paths, removed API constant
- `CasitaSection.jsx` — local image/video paths
- `HeroSection.jsx` — local video path for hero background
- `CommunitySection.jsx` — removed axios, form submits locally
- `EventsPage.jsx` — removed API fetch, uses static events
- `KingsdayWeekenderPage.jsx` — removed Spin & Win, replaced with static promo
- `AgendaSection.jsx` — dark theme
- `ExperienceSection.jsx` — dark theme
- `AboutUsPage.jsx` — dark theme
- `App.css` — dark theme styles, casita grid CSS
- `index.css` — dark event card styles

---

## Verification Checklist
- [x] Build compiles: `yarn build` → success
- [x] No remaining `emergentagent.com` URLs in source
- [x] No remaining `axios` imports
- [x] No remaining `REACT_APP_BACKEND_URL` references
- [x] All images/videos downloaded to `/public/`
- [x] Database exported to JSON
- [x] robots.txt present and correct
- [x] sitemap.xml present and correct
- [x] Meta Pixel and TikTok Pixel tracking preserved
- [x] All event data preserved in static constants
