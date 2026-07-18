# ON HOLD — Spin the Wheel (Play & Win)

Fully built and tested, pulled from the site on 10 July 2026. Everything needed
to relaunch is in this folder.

## What it is
`play.html` — self-contained spin-the-wheel game page (HTML + Tailwind CDN + JS,
no backend). Rendered barrio world as background, brand wheel with the real logo hub.

**Prizes & exact odds**
| Prize | Odds |
|---|---|
| Free ticket | 1/50 |
| 75% off | 1/40 |
| 50% off | 1/30 |
| 35% off | 1/20 |
| No win | ~87.2% |

**Flow**: enroll with email (joins mailing list via FormSubmit → altscantec@gmail.com)
→ 1 spin per email → 30-day cooldown per email (localStorage) → winners get an
auto-confirmation email; code follows within 24h (or set instant codes in the
`PRIZE_CODES` object at the top of play.html — one Weeztix code per tier).

## To relaunch
1. Copy `play.html` → `frontend/public/play.html`
2. Copy `GameTeaserSection.jsx` → `frontend/src/components/sections/`
3. In `HomePage.jsx`: import + render `<GameTeaserSection />` after `<AgendaSection />`
4. In `Navigation.jsx`: re-add the "Play & Win" link (desktop + mobile) → `/play.html`
5. Create Weeztix promo campaigns (100% / 75% / 50% / 35%) and either keep
   manual-reply codes or paste fixed codes into `PRIZE_CODES`
6. First live submission: click the FormSubmit activation link that arrives
   at altscantec@gmail.com (one-time, if not already activated)
