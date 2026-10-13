# Halloween quiz: setup guide

Time to set up everything below: roughly 1 to 2 hours, most of it creating coupons in Weeztix.

## 0. What you need to supply

| # | Item | Where it goes | Notes |
|---|---|---|---|
| 1 | Postgres database URL | Vercel env `DATABASE_URL` | Supabase free tier is fine. Create a **separate project** for the quiz, or put the `quiz` schema in an existing project. Use the "Session pooler" or direct connection string (not the transaction pooler for the migration). The schema has RLS enabled on every table and lives outside `public`, so Supabase's REST API cannot read it |
| 2 | Random secrets | Vercel env | `APP_SECRET` (32+ chars), `ADMIN_API_KEY`, `ANALYTICS_API_KEY`, `CRON_SECRET`. Generate each with `openssl rand -base64 32`. Never reuse one for another |
| 3 | Resend API key + verified domain | `RESEND_API_KEY`, `MAIL_FROM` (for example `Baila Dembow <quiz@bailadembow.com>`), optional `MAIL_REPLY_TO` | The legacy backend already used Resend. Verify the sending domain (SPF/DKIM) so reward emails do not land in spam |
| 4 | Resend webhook | Resend dashboard, Webhooks | URL `https://bailadembow.com/api/webhooks/resend`, events: `email.sent, email.delivered, email.delivery_delayed, email.bounced, email.complained, email.failed`. Copy the signing secret (`whsec_...`) to `RESEND_WEBHOOK_SECRET` |
| 5 | Owner alert address | `OWNER_ALERT_EMAIL` | Receives alerts (inventory low/empty, email failures). Alerts contain no personal data or codes |
| 6 | Discount code pools | Admin, Import codes | Three coupons in Weeztix (see section 3) |
| 7 | Commercial settings | Admin, Settings | Opens/closes, code expiry, eligible tickets, stacking, retention days |
| 8 | Music track (optional) | `REACT_APP_QUIZ_MUSIC_URL` | A file you may use, placed under `frontend/public/audio/` or on a CDN you control |
| 9 | Meta and TikTok reporting | See section 7 | Meta via the connected Meta Ads connector; TikTok via exported CSVs |

Do **not** paste any of these into chat or commit them. Set them in Vercel (Project Settings, Environment Variables). `.env` files are gitignored.

## 1. Database

**Done (13 Oct 2026):** a dedicated Supabase project `baila-dembow-quiz` (ref `ctzoxxeufdndrikrsiid`, Frankfurt, free plan) exists with the `quiz` schema and all tables applied (`001_init.sql`), row-level security on every table. Nothing else lives in that project. You only need to supply its connection string as `DATABASE_URL` (Connect, **Transaction pooler**; reset the database password first, since it is never visible to me).

Use this project for **Preview** testing. Before launch, either wipe it (`TRUNCATE` the quiz tables, or delete the test rows from admin) or create a second project for Production, so no test participants reach the live campaign.


```bash
DATABASE_URL='postgres://...'  npm run migrate     # from the repo root; creates schema "quiz" and tables
```

Run it once against the **preview** database and once against the **production** database. Keep them separate (preview must never hold real participants or real codes).

## 2. Vercel

* The repo root now has a `package.json` (API dependency `pg`) and an `api/` folder. `vercel.json` was updated: install command installs both, `/halloween/quiz*` is served from a clean noindex shell with an `X-Robots-Tag: noindex` header, `/api/*` is never cached or indexed, and a daily cron calls `/api/cron/retry` (retries any stuck reward emails; set `CRON_SECRET` so the call is authenticated).
* Set the environment variables above for Production **and** Preview (use different `DATABASE_URL` values).
* Push the branch. Vercel builds a **preview** deployment; open `<preview-url>/halloween/quiz`.
* Preview URLs may sit behind Vercel's deployment protection (login). That is fine for you; it also keeps the page private while you test.

## 3. Weeztix: real, single-use codes

What was verified: the shop link `https://weeztix.shop/nxaqrkdz` forwards a `?coupon=CODE` parameter to the shop page (tested with a dummy value; this does not prove a code is accepted, only that the parameter is carried). Weeztix's help centre documents percentage coupons, restricting a coupon to chosen tickets, validity dates, generated codes (downloadable as CSV), and a per-code usage limit.

What was **not** verified and is why codes are imported rather than created by API: the Weeztix Dashboard API lists Coupon and CouponCode resources, but the fetched documentation does not show request fields or the OAuth scopes, and it states the endpoints will change. Building against that would be guessing. If you want automatic creation later, send me a working request example and credentials and it can be added behind the same inventory.

Steps (Weeztix dashboard, shop for the Halloween event):

1. Create **three coupons**: 5 %, 10 %, 15 % (type "Percentage").
2. For each: restrict to the Halloween ticket types you want to include (set "Discounted products"), set validity to end at the time you will configure as *Codes expire*, and set usage so each code works **once** ("Reused across orders" = 1, "Reuse per order" = 1 or whatever your quantity rule is).
3. Generate codes: as many as you expect participants for that tier plus a safety margin (a guide: 40 % at 5 %, 40 % at 10 %, 20 % at 15 %, times the number of participants you expect, plus 20 %). You can import more later; people who finish while a tier is empty keep their earned reward and receive it automatically once you import more.
4. Download the CSV for each coupon and import the codes under the matching tier (Admin, Import discount codes).
5. **Test redemption** (required before launch): place one real order with one code from each tier, check the price, whether the booking fee is discounted or not, whether quantities above 1 behave as you want, and whether the code can be reused. Then tick *"I confirmed the Weeztix coupon settings and completed a real test redemption"* in Admin. The campaign cannot be switched on until you do. Put the findings in the *Excluded* and *Stacking* notes (EN/ES/NL) so the email tells people the truth about fees and combinations.
6. Codes are **not** bound to a person inside Weeztix (no such feature is documented); they are bound to the participant in our database and only ever sent to that person's email.

## 4. Owner admin

`https://bailadembow.com/halloween/quiz/admin` (also noindex). Paste `ADMIN_API_KEY`; it is held in memory only. Every call is authenticated; there is no unauthenticated admin endpoint. Sections: launch readiness, settings, code import and inventory, question bank import, email failures with retry, order import (purchases), aggregate metrics, consent-filtered lead export, retention and erasure.

Import the question bank: Admin, Question bank, choose `quiz-private/question-bank.json`.

## 5. Settings to decide (Admin, Settings)

* **Opens / Closes / Codes expire**: Europe/Amsterdam. Suggested: close the quiz before the price rise or event day as you prefer; codes should expire no later than the coupon validity in Weeztix.
* **Eligible ticket types / excluded note / stacking note / redemption note**: shown in the reward email in all three languages.
* **Retention days**: how long after closing non-opted-in data is kept. Required before launch. Opted-in people stay until they unsubscribe.
* **Show answers after completion**: off by default (turning it on lets people harvest the answer key).
* Switch on **Campaign enabled** last.

## 6. GTM and ad URLs

See [tracking.md](tracking.md): GA4 tags and triggers to create in GTM, and the URL parameter templates for Meta and TikTok ads. Do not add Meta/TikTok pixel tags to GTM.

## 7. Daily report agent

See [daily-agent/](daily-agent/). Summary: a local Claude scheduled task reads `quiz-private/agent-config.json`, calls the read-only metrics endpoint with `ANALYTICS_API_KEY`, reads Meta through the Meta Ads connector (read tools only), reads TikTok export CSVs from `quiz-private/exports/tiktok/`, and writes the report in the Claude session (and a local copy in `quiz-private/reports/`). It never changes anything and never sends the report anywhere.

**Status (13 Oct 2026): the schedule IS active.** Claude scheduled task `halloween-quiz-daily-report` runs daily at 09:00 Europe/Amsterdam (the app adds up to a few minutes of jitter; next run 14 Oct 2026 about 09:03). Until you create `quiz-private/agent-config.json` and launch, each run just prints what is missing and stops. It only runs while the Claude desktop app is open; if the app was closed at 09:00 it runs on next launch. To pause it, use the Scheduled section in the app sidebar. Copy `docs/quiz/daily-agent/agent-config.example.json` to `quiz-private/agent-config.json` and fill it in.

## 8. Running locally

```bash
# mirror the repo to a non-Drive folder first (Drive-backed builds are slow), then:
npm install                       # root: pg (+ embedded-postgres for tests)
npm test                          # 60+ tests against a real embedded Postgres
cd frontend && npm install --legacy-peer-deps && CI=false npm run build && cd ..
node server/dev-server.js --build frontend/build     # http://localhost:3999/halloween/quiz
```

The dev server uses a throwaway Postgres, a fake mailbox (`/__dev/outbox?to=<email>`), and synthetic codes. It refuses to run on Vercel. Never use real people or real codes with it.

## 9. Things in the repository you should know about

* `export/data/discount_codes.json` (500 old codes) and `export/data/subscribers.json` (4 email addresses) are **tracked in this public GitHub repository**. They come from the earlier King's Day promotion. Check the codes are expired or revoked; consider removing the files (and history) and treat the addresses as already exposed.
* There was no privacy notice on the site. A draft covering the quiz and cookies is at `/privacy` (EN/ES/NL), written from the facts in the repo. **Have it checked** before launch; it is not legal advice.
* The old FastAPI/Mongo backend (`backend/`) is unused by the website and is untouched.
