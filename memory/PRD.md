# Baila Dembow - Product Requirements Document

## Original Problem Statement
Create a cinematic, high-converting website for "Baila Dembow," a Latin cultural event platform. The site includes a hero section, event listings, admin panel, SEO, GDPR cookie banner, and a dedicated Kingsday Weekender 2026 campaign page with Spin & Win game.

## Tech Stack
- **Frontend**: React, TailwindCSS, Framer Motion, HashRouter
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB (Motor async driver)
- **Email**: Resend (transactional emails)

## Architecture
```
/app
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py           # FastAPI app with all endpoints
│   └── spin_and_win.csv    # 500 discount codes (seeded on startup)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     # Navigation, FloatingCTA
│   │   │   ├── pages/      # HomePage, AdminPage, KingsdayWeekenderPage, etc.
│   │   │   └── sections/   # Homepage sections
│   │   ├── context/        # CookieConsentContext
│   │   ├── utils/          # constants, tracking
│   │   └── App.js          # HashRouter setup
│   └── package.json
└── memory/
    └── PRD.md
```

## Core Features (Completed)

### Homepage
- Hero section, event listings, gallery, community signup
- Mobile-responsive navigation with cookie consent banner
- Meta Pixel + TikTok Pixel tracking

### Admin Panel (/#/admin)
- Password-protected (bailadembow2024)
- Gallery management (add/delete/reorder images)
- **Discount Code Management** (added Dec 2025):
  - Stats dashboard (total/available/assigned)
  - Bulk upload codes (text input)
  - View codes with filter (All/Unused/Used)
  - Table with code, status, assigned email, timestamp

### Kingsday Weekender 2026 Page (/#/events/kingsday-weekender-2026)
- Premium editorial design with burnt orange color palette
- Countdown timer, hero section, ticket section, schedule, experiences
- **Spin & Win Game** with real discount code system

### Discount Code System (Completed Dec 2025)
- **500 pre-generated codes** from CSV, seeded into MongoDB on startup
- **Spin flow**: Subscribe → Verify email → Spin wheel → Prize
- **10% Discount wins**: Code assigned from DB (atomic operation), emailed via Resend
- **Other wins**: Auto-generated codes shown in popup
- **Security**: One spin per user, one code per email, email normalization (Gmail alias prevention)
- **Admin**: View/filter/upload codes, stats dashboard
- **Email**: Branded HTML email via Resend with discount code and instructions

## Key DB Collections
- `kingsday_subscribers`: email, normalized_email, verified, verification_token, has_spun, spin_result, coupon_code
- `discount_codes`: code, type, is_used, assigned_email, assigned_at
- `gallery`: url, alt, order
- `subscribers`: email subscriber list

## Key API Endpoints
- `POST /api/kingsday/subscribe` - Subscribe email
- `GET /api/kingsday/verify/{token}` - Verify email
- `POST /api/kingsday/spin` - Spin the wheel
- `GET /api/admin/discount-codes/stats` - Code statistics
- `GET /api/admin/discount-codes?status=used|unused` - List codes
- `POST /api/admin/discount-codes/upload` - Bulk upload codes
- `POST /api/admin/verify` - Admin login

## Environment Variables
- `MONGO_URL`, `DB_NAME` - MongoDB
- `RESEND_API_KEY` - Resend email service
- `SENDER_EMAIL` - Email sender address
- `ADMIN_PASSWORD` - Admin panel password

## Known Limitations
- Resend in test mode only sends to account owner email. Needs domain verification for production.
- Spin & Win email verification is auto-verified (no real verification email sent yet)
- Events are hardcoded in both frontend and backend

## Backlog (P2)
- Move hardcoded events to MongoDB
- Add real email verification flow (send actual verification links)
- IP-based abuse prevention for Spin & Win
- Image optimization for admin uploads
- Refactor server.py into modular routes with APIRouter
