# Halloween 2027 early-release list

Page: `https://bailadembow.com/halloween/2027` (unlisted: served from the noindex shell, not in the sitemap or navigation).

**What it does.** Visitors leave full name, email address and phone number and tick one consent box. Then: (1) a 6-digit code is emailed (Resend) and must be entered, 30 min, 5 attempts, 3 resends/hour; (2) a one-time code is sent to the phone over WhatsApp, SMS as fallback (Twilio Verify, `server/sms/twilioVerify.js`), and must be entered. Only rows with both `email_verified_at` and `phone_verified_at` count. Then one confirmation email with a signed "remove me" link. WhatsApp can only be triggered after the email is verified, so nobody can make us message a number they do not own. If the Twilio env vars are unset the phone step is skipped (status `phoneVerification: off`).

**Twilio setup (Vercel, Production):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (a Verify Service with the WhatsApp and SMS channels enabled). Styling follows the 2027 poster (`frontend/src/halloween2027/halloween2027.css`, texture `public/images/h27/`).

**Hidden until** `H27_OPENS_AT` (Vercel env; default `2026-11-01T05:00:00+01:00`, i.e. 1 November 2026 05:00 Amsterdam, when the 2026 party ends). Before that moment the page shows a plain 404 screen and the API refuses sign-ups (`403 not_open`). No deploy is needed at the opening moment: the server clock decides. Preview the form early with `?preview=1` (sign-ups still refused).

**After it opens (to do, one small deploy):** remove the `/halloween/2027` rewrites in `vercel.json`, drop `noindex` for the route in `App.js`, add the route to `frontend/scripts/prerender.js` ROUTES and `public/sitemap.xml`, and link it from the homepage/Halloween page.

**Data.** Table `quiz.h27_signups` (migration `server/migrations/004_halloween_2027.sql`): one row per email (repeat sign-ups update the row), phone stored as typed and normalised to `+<digits>` (Dutch `06…` becomes `+316…`), exact consent wording and time, allow-listed UTM attribution, confirmation status. Rate limits: 10 sign-ups per IP per hour, 3 per email per hour. Nothing personal is logged.

**Owner.** Quiz admin page (`/halloween/quiz/admin`) → "Halloween 2027 early-release list": count and **Download CSV** (`GET /api/admin/h27/leads.csv`, admin key; every export is written to the audit log). Columns: name, email, phone, consent time, sign-up time, utm_source, utm_campaign, unsubscribe URL.

**Privacy.** Section "Halloween 2027 early-release list" in `/privacy` (EN/ES/NL): purpose, consent basis, retention (until the 2027 early release and at most 31 Dec 2027, or until removal), contact. Keep the list to that purpose: do not import it into general promo lists without separate consent.

**Measurement.** `dataLayer` events `h27_view`, `h27_signup_success`, `h27_share_click` (analytics/marketing consent only) and a Meta `Lead` on success (marketing consent only). No form values are ever sent.

**Tests.** `server/test/h27.test.js` (hidden/open gate, full email+WhatsApp happy path, code attempts/expiry/resend, email-before-phone rule, WhatsApp failure -> SMS, provider off, one row per email with verified rows protected, validation, phone formats, rate limits, mail failure, owner export + audit). Local dev server (`H27_OPENS_AT=2020-01-01T00:00:00Z node server/dev-server.js`) uses a fake provider: any started number accepts code 123456; `/__dev/sms` lists the sends.
