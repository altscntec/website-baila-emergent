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
- Countdown timer to next event
- Bento grid gallery with user-provided images
- Event cards with urgency indicators (On Sale, Almost Sold Out)
- Email subscription with MongoDB storage
- SEO optimized with Open Graph, Twitter cards, JSON-LD structured data
- Mobile-first responsive design

## Architecture
- **Frontend**: React with Framer Motion animations, Tailwind CSS
- **Backend**: FastAPI with MongoDB (Motor async driver)
- **Database**: MongoDB (subscribers collection, status_checks collection)
- **External Services**: YouTube embed, user-provided images from customer-assets

## What's Been Implemented (Feb 18, 2026)
✅ Hero section with YouTube video background (autoplay, muted, looped)
✅ Gradient text headlines (Pink → Red → Violet)
✅ Anton + Manrope typography
✅ Floating navigation with glassmorphism effect
✅ Countdown timer to next event (Feb 28, 2026 Amsterdam XL)
✅ Next Event section with event details and ticket CTA
✅ Experience gallery with 7 user-provided images in Bento grid
✅ Agenda section with 3 event cards
✅ Status badges (On Sale, Almost Sold Out) with animations
✅ Email subscription form with MongoDB integration
✅ Toast notifications (Sonner)
✅ Social links (Instagram @baila.dembw, WhatsApp group, Email)
✅ Sticky floating GET TICKETS button with pulse animation
✅ SEO meta tags, Open Graph, Twitter cards, JSON-LD schema
✅ Mobile responsive design
✅ Grain texture overlay for premium feel
✅ Separate pages: About Us, Press, Events with hash-based routing (/#/about, /#/press, /#/events)
✅ Password-protected Admin Panel (/#/admin) for gallery management
✅ Meta and TikTok tracking pixels integrated
✅ sitemap.xml and robots.txt for SEO
✅ **City-specific photo galleries on About page**: Amsterdam (3 photos), Rotterdam (3 photos), Utrecht (3 photos), Tilburg (3 photos), London (3 photos) - 15 photos total hosted locally

## API Endpoints
- `GET /api/` - Health check
- `GET /api/events` - Returns 3 upcoming events
- `POST /api/subscribe` - Email subscription (validates duplicates)
- `GET /api/subscribers` - Admin endpoint for subscriber list

## Events Data
1. **Feb 28, 2026** - Amsterdam XL @ IJland (€10-€35)
2. **Mar 14, 2026** - Leiden @ Wibar Club (€10-€25) - ALMOST SOLD OUT
3. **Apr 26, 2026** - Amsterdam Kingsnight @ IJland (€15-€30)

## External Links
- Tickets: https://linktr.ee/bailadembow
- Instagram: @baila.dembw
- WhatsApp: https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6

## Prioritized Backlog
### P0 (Critical) - DONE
- Core website functionality
- All sections rendering
- Email subscription working

### P1 (Important) - Future
- Admin dashboard for managing events
- Real ticket integration (Weeztix API)
- Analytics tracking (GA4, Meta Pixel)
- Multi-language support (Dutch, Spanish, English)

### P2 (Nice to Have) - Future
- Blog/news section
- Artist/DJ profiles
- Photo gallery from past events (user uploads)
- Loyalty program integration

## Next Tasks
1. **User Verification Pending**: Admin panel access on live domain (bailadembow.com/#/admin) - requires user to redeploy
2. Refactor monolithic App.js (~1500 lines) into smaller components for maintainability
3. Image optimization for faster loading (some city photos are 15-30MB)
4. Add analytics tracking (GA4)
5. Implement event management admin panel
6. Add real-time ticket availability from Weeztix
7. Localization (i18n) for Dutch and Spanish

## City Photos Location
Photos are stored in `/app/frontend/public/city-photos/`:
- amsterdam1.jpg, amsterdam2.jpg, amsterdam3.jpg
- rotterdam1.jpg, rotterdam2.jpg, rotterdam3.jpg  
- utrecht1.jpg, utrecht2.jpg, utrecht3.jpg
- tilburg1.jpg, tilburg2.jpg
- london1.jpg, london2.jpg, london3.jpg
