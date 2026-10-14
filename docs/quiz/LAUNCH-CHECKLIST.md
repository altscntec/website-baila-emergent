# Launch checklist

The campaign is **off** and cannot be switched on from the admin until the items marked (gate) are done. Work top to bottom.

## A. Accounts and secrets (you)
- [ ] Postgres database created; `DATABASE_URL` set in Vercel (Production and, separately, Preview). Migration run: `npm run migrate`
- [ ] `APP_SECRET`, `ADMIN_API_KEY`, `ANALYTICS_API_KEY`, `CRON_SECRET` generated and set (each different)
- [ ] Resend: sending domain verified; `RESEND_API_KEY`, `MAIL_FROM` set. (gate: admin shows "email provider configured")
- [ ] Resend webhook created for `https://bailadembow.com/api/webhooks/resend`; `RESEND_WEBHOOK_SECRET` set
- [ ] `OWNER_ALERT_EMAIL` set
- [ ] In Resend, send a **test webhook event** to the preview URL and confirm it is accepted (HTTP 200). A 401 means the raw request body was altered on its way in; tell me and I will switch the endpoint to Vercel's raw-body helper

## B. Offer (you, in Weeztix and the admin)
- [ ] Three Weeztix coupons (5 %, 10 %, 15 %) restricted to the intended Halloween tickets, single use, validity matching "codes expire"
- [ ] Codes imported per tier (gate: at least one code in each tier; aim for the guide in SETUP.md)
- [ ] **Real test redemption** done with a code from each tier; fee behaviour, quantity behaviour and reuse behaviour noted (gate: "offer confirmed" box)
- [ ] Eligible tickets, excluded items, stacking and redemption notes written in EN/ES/NL
- [ ] Opens / closes / codes expire set, Europe/Amsterdam (gate)
- [ ] Retention days chosen (gate)

## C. Content
- [ ] Question bank reviewed (`quiz-private/QUESTION-BANK-REVIEW.md`) and imported (gate: 10+ active questions per theme)
- [ ] Spanish and Dutch copy skimmed by a native speaker (UI strings in `frontend/src/quiz/strings.js`, emails in `server/email/templates.js`, privacy notice)
- [ ] Privacy notice (`/privacy`) checked by you or a lawyer; controller details correct
- [ ] Music track supplied and licensed, or leave the slot empty
- [ ] Old public exposures dealt with: `export/data/discount_codes.json` and `export/data/subscribers.json`

## D. Tracking
- [ ] GTM: GA4 event tag + `^quiz_` trigger + key events set; **no** Meta/TikTok tags added
- [ ] Meta and TikTok ad URLs carry the parameter templates from tracking.md
- [ ] One end-to-end pass on a Vercel **preview** with test addresses: events visible in GTM preview, none visible after "Reject all"

## E. Go-live
- [ ] Merge `feature/halloween-quiz` to `main` (production deploy)
- [ ] Production smoke test with your own address: signup, email arrives (check spam), verify, play, reward email arrives, link applies the code at checkout, resend works, second signup shows "already played"
- [ ] Admin: switch on **Campaign enabled**
- [ ] Confirm `X-Robots-Tag: noindex` on `https://bailadembow.com/halloween/quiz` and that the URL is not in the sitemap
- [ ] First import of the Weeztix order export scheduled (daily during the campaign) so purchases and revenue appear in reports
- [ ] Daily report task enabled (status in SETUP.md); `quiz-private/agent-config.json` filled in

## F. After the campaign
- [ ] Switch off, final order import, export opted-in leads (consent-filtered), run retention (dry run first)
