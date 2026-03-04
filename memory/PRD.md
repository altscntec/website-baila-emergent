# Baila Dembow - Product Requirements Document

## Original Problem Statement
Create a cinematic, emotionally immersive, high-converting event website for Baila Dembow - a Latin cultural movement platform combining cinematic artistic design with hyper-aggressive conversion psychology.

## User Personas
- **Latin diaspora in Europe**: Dominicans, Colombians, Puerto Ricans, Mexicans, Venezuelans seeking cultural connection
- **International students**: 18-35 age group in university cities
- **Dutch locals**: Interested in Latin culture and nightlife
- **Event enthusiasts**: People who follow reggaeton, dembow, and urban Latin music

## Core Requirements
- Full-screen hero with YouTube video background
- Sticky floating "GET TICKETS" CTA button
- Countdown timer to next event (uses both date AND time for accuracy)
- Bento grid gallery with user-provided images
- Event cards with urgency indicators (On Sale, Almost Sold Out)
- Email subscription with MongoDB storage
- SEO optimized with Open Graph, Twitter cards, JSON-LD structured data
- Mobile-first responsive design
- GDPR-compliant cookie consent banner
- Mobile hamburger menu

## Architecture

### Frontend Structure (REFACTORED - Feb 28, 2026)
```
/app/frontend/src/
├── App.js                    # Main entry point (~110 lines, down from ~2965)
├── App.css                   # Styles
├── index.js                  # React entry
├── context/
│   └── CookieConsentContext.jsx   # Cookie consent provider & banner
├── utils/
│   ├── constants.js          # Logo URLs, pixel IDs, fallback events
│   ├── tracking.js           # Meta/TikTok pixel loading & tracking
│   └── helpers.js            # generateEventSlug, getEventBySlug
├── components/
│   ├── index.js              # Barrel exports
│   ├── common/
│   │   ├── Navigation.jsx    # Main nav with mobile menu
│   │   ├── FloatingCTA.jsx   # Sticky GET TICKETS button
│   │   ├── CountdownTimer.jsx # Event countdown
│   │   └── EventModal.jsx    # Event quick-view modal
│   ├── sections/
│   │   ├── HeroSection.jsx   # Hero + LatinEventSection
│   │   ├── NextEventSection.jsx
│   │   ├── ExperienceSection.jsx
│   │   ├── AgendaSection.jsx
│   │   └── CommunitySection.jsx
│   └── pages/
│       ├── HomePage.jsx
│       ├── AdminPage.jsx
│       ├── PressPage.jsx
│       ├── AboutUsPage.jsx
│       ├── EventsPage.jsx
│       ├── SingleEventPage.jsx
│       └── SEOPages.jsx      # LatinEventAmsterdamPage, LatinEventRotterdamPage
```

### Backend: FastAPI with MongoDB (Motor async driver)
### Database: MongoDB (subscribers collection, gallery_images collection)
### External Services: YouTube embed, user-provided images from customer-assets

## What's Been Implemented

### Mar 4, 2026 - Events Update & UI Changes
✅ **Updated events list** - Removed past Feb 28 event, added new Amsterdam Mar 28 event at Oliva
✅ **Removed countdown section** - NextEventSection removed from homepage per user request
✅ Events now: Rotterdam (Mar 7), Leiden (Mar 14), Amsterdam Oliva (Mar 28), Kingsnight (Apr 26)

### Previously Implemented
✅ Hero section with YouTube video background
✅ Gradient text headlines (Pink → Red → Violet)
✅ Anton + Manrope typography
✅ Floating navigation with glassmorphism effect
✅ Countdown timer to next event
✅ Next Event section with event details and ticket CTA
✅ Experience gallery with 8 user-provided images in Bento grid
✅ Agenda section with 4 event cards
✅ Status badges (On Sale, Almost Sold Out) with animations
✅ Email subscription form with MongoDB integration
✅ Toast notifications (Sonner)
✅ Social links (Instagram, WhatsApp, Email, TikTok, YouTube, Facebook)
✅ Sticky floating GET TICKETS button with pulse animation
✅ SEO meta tags, Open Graph, Twitter cards, JSON-LD schema
✅ Mobile responsive design with hamburger menu
✅ Grain texture overlay for premium feel
✅ Hash-based routing (/#/about, /#/press, /#/events, /#/admin)
✅ Password-protected Admin Panel for gallery management
✅ Meta and TikTok tracking pixels with consent
✅ GDPR-compliant cookie consent banner with preferences
✅ sitemap.xml and robots.txt for SEO
✅ City-specific photo galleries on About page (15 photos)
✅ Hybrid event system: Quick-view modal + SEO-optimized event pages
✅ SEO landing pages for Amsterdam and Rotterdam

## API Endpoints
- `GET /api/` - Health check
- `GET /api/events` - Returns 4 upcoming events
- `POST /api/subscribe` - Email subscription (validates duplicates)
- `GET /api/subscribers` - Admin endpoint for subscriber list
- `POST /api/admin/verify` - Admin password verification
- `GET /api/gallery` - Get gallery images
- `POST /api/gallery` - Add gallery image
- `DELETE /api/gallery/{id}` - Delete gallery image

## Events Data
1. **Mar 7, 2026** - Rotterdam @ Club Reverse (€10-€25)
2. **Mar 14, 2026** - Leiden @ Wibar Club (€10-€25)
3. **Mar 28, 2026** - Amsterdam @ Oliva, Rembrandtplein (€10-€25) - NEW!
4. **Apr 26, 2026** - Amsterdam Kingsnight @ IJland (€15-€30)

## External Links
- Tickets: https://linktr.ee/bailadembow
- Instagram: @baila.dembow
- WhatsApp: https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6

## Credentials
- Admin Panel: `/#/admin`
- Admin Password: `bailadembow2024` (stored in ADMIN_PASSWORD env var)

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ Core website functionality
- ✅ All sections rendering
- ✅ Email subscription working
- ✅ **Refactored monolithic App.js** (Feb 28, 2026)
- ✅ Countdown timer accuracy fix

### P1 (Important) - Pending User Verification
- Admin panel access on live domain (bailadembow.com/#/admin) - requires user to redeploy

### P2 (Future)
- Image optimization for faster loading (implement compression on upload)
- Real ticket integration (Weeztix API)
- Analytics tracking (GA4)
- Multi-language support (Dutch, Spanish, English)
- Admin dashboard for managing events
- Blog/news section
- Artist/DJ profiles
- Loyalty program integration

## File Locations
- City photos: `/app/frontend/public/city-photos/`
- Gallery photos: `/app/frontend/public/gallery/`
- Main styles: `/app/frontend/src/App.css`

## Notes for Future Agents
1. **Component Structure**: The app is now properly modularized. Each component is in its logical location.
2. **Domain/DNS Issues**: Live domain issues are USER-SIDE (DNS configuration). Direct users to "Link domain" feature in Emergent platform.
3. **Admin Password**: Sourced from `ADMIN_PASSWORD` environment variable in `/app/backend/.env`
4. **Routing**: Uses hash-based routing for SPA compatibility with static hosting.
