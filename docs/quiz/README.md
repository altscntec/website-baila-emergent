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

* **Frontend** (`frontend/src/quiz/`): **play first** - language step (EN/ES/NL, browser suggestion, persisted), rules, five-question quiz, score and discount tier, then the claim form (name, email, age, gender, city, country), email verification (link or 6-digit code), claimed screen; music control slot, consent-aware analytics, owner admin page, unsubscribe page. Also `/privacy` (privacy notice, EN/ES/NL). Black-and-white UI with an orange accent, animated castle-and-smoke backdrop (CSS/SVG only, still under reduced motion), framer-motion step transitions.
* **API** (`api/index.js` + `server/`): one Vercel function. Postgres schema `quiz` (migrations `server/migrations/001_init.sql`, `002_play_first.sql`), anonymous browser sessions (HttpOnly cookie) that own one attempt each, balanced random theme assignment, server-side scoring from a snapshot of the answer key, one reward per verified email (database unique constraints; the code is issued only when the email is verified), expiring single-use verification, rate limits, reward issuance with atomic code reservation, email outbox with retries and idempotency, Resend adapter and signed webhook handling, owner endpoints, aggregate metrics endpoint for the daily agent.
* **Question bank**: 48 questions (12 per theme) in EN/ES/NL, with explanations and internal source notes, verified by `quiz-private/verify-bank.js`.
* **Emails**: verification (3 variants: new, resume, already played) and reward, in EN/ES/NL (`server/email/templates.js`).

## Flow (play first)

1. Visitor picks a language and reads the rules; "Start" creates an anonymous session (cookie, `Path=/api`) and an attempt with 5 questions from one balanced-random theme.
2. Answers are locked one by one on the server; the final answer is scored server-side and the tier (5/10/15 %) is shown.
3. The claim form appears **after** the score. Submitting it attaches the attempt to the participant and sends the verification email.
4. Verifying (link or code) issues the discount code and emails it. The code never appears in the browser.

Known limitation: before verifying, the same person can clear cookies and play again as a new anonymous session; this only costs question exposure, because every email address can claim one reward and the first verified attempt wins. Starts are rate-limited per IP (20/h).

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
