# Halloween 2027 signup page (The Latin Halloween Indoor Fest)

Page: `https://bailadembow.com/halloween/2027` (unlisted: served from the noindex shell, not in the sitemap or navigation).

**What it does.** The approved landing page (ported 1:1 from the supplied static page; design preserved: supplied pink texture as the page background, the transparent event artwork shown complete, the official white logo unchanged, Impact/Arial typography, fluorescent-green footer line). Visitors leave full name, email and phone number and tick the supplied consent ("I agree to receive Halloween 2027 event updates from Baila Dembow by email and WhatsApp. I can unsubscribe at any time." - wording, version `2027-updates-v1` and time are stored). A 6-digit code is emailed (Resend; 30 min, 5 attempts, 3 resends/hour, client asks to wait 30 s between resends) and must be entered; the signup counts only once `email_verified_at` is set, and then one confirmation email with a signed removal link goes out. **Email only:** no WhatsApp verification or WhatsApp messages are triggered by this page. The Twilio phone step exists in the code but is off unless `H27_PHONE_VERIFICATION=on` and the Twilio env vars are set.

**Routes.** Page `/halloween/2027` (canonical, existing); `/halloween-2027` redirects to it. API: `POST /api/h27/signup` {fullName,email,phone,consent,attribution} -> {token,next,email(masked),emailCode}; `POST /api/h27/email/verify` {token,code}; `POST /api/h27/email/resend` {token}; `POST /api/h27/unsubscribe` {token}. Errors are `{error:<code>}` which the page turns into visitor-friendly messages (the handoff's `/api/halloween-2027/start|verify-email|resend` contract, adapted to the existing API).

**Hidden until** `H27_OPENS_AT` (Vercel env; default `2026-11-01T04:00:00+01:00`, i.e. 1 November 2026 04:00 Amsterdam (Hari's choice, 25 Oct)). Before that moment the page shows a plain 404 screen and the API refuses sign-ups (`403 not_open`). No deploy is needed at the opening moment: the server clock decides. Preview the form early with `?preview=1` (sign-ups still refused).

**After it opens (to do, one small deploy):** remove the `/halloween/2027` rewrites in `vercel.json`, drop `noindex` for the route in `App.js`, add the route to `frontend/scripts/prerender.js` ROUTES and `public/sitemap.xml`, and link it from the homepage/Halloween page.

**Data.** Table `quiz.h27_signups` (migration `server/migrations/004_halloween_2027.sql`): one row per email (repeat sign-ups update the row), phone stored as typed and normalised to `+<digits>` (Dutch `06…` becomes `+316…`), exact consent wording and time, allow-listed UTM attribution, confirmation status. Rate limits: 10 sign-ups per IP per hour, 3 per email per hour. Nothing personal is logged.

**Owner.** Quiz admin page (`/halloween/quiz/admin`) → "Halloween 2027 early-release list": count and **Download CSV** (`GET /api/admin/h27/leads.csv`, admin key; every export is written to the audit log). Columns: name, email, phone, consent time, sign-up time, utm_source, utm_campaign, unsubscribe URL.

**Privacy.** Section "Halloween 2027 early-release list" in `/privacy` (EN/ES/NL): purpose, consent basis, retention (until the 2027 early release and at most 31 Dec 2027, or until removal), contact. Keep the list to that purpose: do not import it into general promo lists without separate consent.

**Measurement.** `dataLayer` events `h27_view`, `h27_signup_success`, `h27_share_click` (analytics/marketing consent only) and a Meta `Lead` on success (marketing consent only). No form values are ever sent.

**Browser checks.** `node server/test/browser-h27.js` against the local dev server: phone / small phone / desktop rendering with the approved copy, real artwork and logo, green footer and privacy link; keyboard-only signup with invalid inputs, wrong code, resend throttle, edit details, new code, completion; duplicate signups; stale code; unsubscribe link; axe on every screen; screenshots to `$SHOTS`.

**Tests.** `server/test/h27.test.js` (hidden/open gate, full email+WhatsApp happy path, code attempts/expiry/resend, email-before-phone rule, WhatsApp failure -> SMS, provider off, one row per email with verified rows protected, validation, phone formats, rate limits, mail failure, owner export + audit). Local dev server (`H27_OPENS_AT=2020-01-01T00:00:00Z node server/dev-server.js`) uses a fake provider: any started number accepts code 123456; `/__dev/sms` lists the sends.
