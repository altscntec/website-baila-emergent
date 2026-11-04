# Noctia

Marketing, ticketing data and night-of operations for event promoters, run every night by an AI. A static site: plain HTML, CSS and JavaScript, no build step. The design lives on the Claude Design canvas and this folder mirrors it.

## Pages

- `index.html` — homepage in the filmstrip layout: full-bleed hero, slide counter, index list, film strip of events, forecast frame, night-shift log, steps, pricing, contact frame.
- `dashboard.html` — one event's dashboard: tickets, revenue, spend, forecast chart, price tiers, channels, night-of panel, morning note.
- `database.html` — the event database: totals, filters, events table, fan segments, venues.
- `campaigns.html` — budget recommender, one card per channel, creative hub, ticket-level attribution.
- `start.html` — onboarding: add an event or connect ticketing, then an email for the morning report.
- `about.html`, `terms.html`, `privacy.html`, `acceptable-use.html`.

The numbers on the app pages are demo data. Wire them to your ticketing and ad accounts when the backend exists.

## Images

`assets/img/` holds resized Baila Dembow event photos copied from `frontend/public`. Swap any of them for new shots with the same file names.

## Deploy

Any static host works. On Vercel, create a project with the root directory set to `noctia/`; `vercel.json` enables clean URLs and redirects the old `/live` and `/new` paths. Locally:

```
cd noctia && python3 -m http.server 8080
```
