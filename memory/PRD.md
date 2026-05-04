# Baila Dembow - Product Requirements Document

## Original Problem Statement
Create a cinematic, high-converting website for "Baila Dembow," a Latin cultural event platform in the Netherlands. Fully migrated to a static React site for self-hosted deployment.

## Tech Stack
- **Frontend**: React (CRA + CRACO), TailwindCSS, Framer Motion
- **Routing**: Hash-based (`/#/page`)
- **No Backend** — fully static site (backend removed during migration)

## Current Status: MIGRATED TO STATIC
- All backend dependencies removed
- All external CDN URLs replaced with local paths
- MongoDB data exported to JSON
- Ready for deployment on Vercel/Netlify/Cloudflare Pages

## Pages
| Route | Page |
|-------|------|
| `/#/` | Homepage |
| `/#/events` | Events listing |
| `/#/events/:slug` | Single event detail |
| `/#/events/kingsday-weekender-2026` | Kingsday Weekender campaign |
| `/#/about` | About Us |
| `/#/press` | Press |
| `/#/latin-event-amsterdam` | SEO page |
| `/#/latin-event-rotterdam` | SEO page |

## Features Preserved
- Hero section with video background
- Event listings with ticket links
- Casa De Baila Dembow section (photos + videos)
- Experience gallery
- Community section
- Cookie consent (GDPR)
- Meta Pixel + TikTok Pixel tracking
- SEO structured data (MusicEvent, Organization)
- robots.txt + sitemap.xml

## Features Removed (Required Backend)
- Spin & Win interactive game → replaced with static promo CTA
- Community signup form → shows success toast only
- Admin panel → deleted
- Discount code system → data exported to JSON
- Email integration (Resend) → removed

## Documentation
- `/docs/migration-log.md` — full migration changelog
- `/docs/deployment-guide.md` — Vercel/Netlify/Cloudflare deployment instructions + DNS
- `/docs/github-setup.md` — GitHub repo creation instructions
- `/export/data/` — all exported MongoDB data as JSON
