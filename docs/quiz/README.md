# Halloween quiz campaign: handover index

Page: `/halloween/quiz` (unlisted, noindex). Branch: `feature/halloween-quiz`. The campaign ships **switched off**; nothing is public until you finish the launch checklist.

| Doc | What it is |
|---|---|
| [SETUP.md](SETUP.md) | Accounts, credentials, environment variables, Weeztix coupon setup, step-by-step |
| [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) | The short list of things that must be true before you publish the offer |
| [tracking.md](tracking.md) | Event schema, GTM/Meta/TikTok mapping, attribution, what purchase data exists and what does not |
| [measurement.md](measurement.md) | Metric definitions with denominators and attribution labels |
| [daily-agent/](daily-agent/) | Read-only daily report workflow for Claude (prompt, config sample, report template) |
| [TEST-RESULTS.md](TEST-RESULTS.md) | What was tested, how, and what could not be tested |

Private (never committed, folder `quiz-private/`): `question-bank.json` (answer key), `QUESTION-BANK-REVIEW.md`, `build-bank.js`, `verify-bank.js`, agent config and exports.

## What was built

* **Frontend** (`frontend/src/quiz/`): language step (EN/ES/NL, browser suggestion, persisted), rules, participant form, email verification (link and 6-digit code), five-question quiz, result page, music control slot, consent-aware analytics, owner admin page, unsubscribe page. Also `/privacy` (privacy notice, EN/ES/NL).
* **API** (`api/[...route].js` + `server/`): one Vercel function. Postgres schema `quiz` (migration `server/migrations/001_init.sql`), balanced random theme assignment, server-side scoring from a snapshot of the answer key, one attempt per verified email (database unique constraint), expiring single-use verification, rate limits, reward issuance with atomic code reservation, email outbox with retries and idempotency, Resend adapter and signed webhook handling, owner endpoints, aggregate metrics endpoint for the daily agent.
* **Question bank**: 48 questions (12 per theme) in EN/ES/NL, with explanations and internal source notes, verified by `quiz-private/verify-bank.js`.
* **Emails**: verification (3 variants: new, resume, already played) and reward, in EN/ES/NL (`server/email/templates.js`).

## What is real and what is awaiting a connection

| Piece | Status |
|---|---|
| Quiz UI, API, database logic, scoring, verification, rate limits, outbox, owner controls | Built and tested against a real Postgres |
| Question bank | Built, verified, **needs your review** (`quiz-private/QUESTION-BANK-REVIEW.md`) |
| Resend email sending and delivery webhooks | Code complete and unit-tested with a fake provider. **Awaiting** your `RESEND_API_KEY`, verified sending domain, and webhook secret. Not tested against Resend itself |
| Database | **Awaiting** a Postgres `DATABASE_URL` (Supabase works; see SETUP) |
| Discount codes | **Awaiting** the three code pools generated in Weeztix (the page cannot invent codes). Weeztix coupon creation by API was not automated: the public docs do not specify the request format |
| Redemption / purchase data | **Awaiting** your Weeztix order export, imported through admin. No automatic purchase feed exists |
| Music | **Awaiting** a track you have rights to. The slot is `REACT_APP_QUIZ_MUSIC_URL`; with none set the control does not appear |
| GTM | Events are in `dataLayer`; **awaiting** the GA4 tag/trigger setup in your container |
| Daily report | Workflow and prompt built; see the status line in SETUP.md for whether the schedule is active |

## Known limitation (documented on purpose)

One attempt per **verified email address**. Different email addresses can belong to the same person; the system does not fingerprint devices or browsers. Mitigations: email verification, per-IP and per-address rate limits, and a heuristic "suspicious repeats" count (same name, city, country and age) in the metrics for the owner to eyeball.
