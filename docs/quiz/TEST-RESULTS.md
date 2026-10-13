# Test results

Run on 13 October 2026 against the final build of branch `feature/halloween-quiz`. Everything used synthetic people (`*.test.invalid` addresses), synthetic discount codes (`LOCALTEST...`), a throwaway embedded PostgreSQL, a capturing fake mailbox, and recording stubs in place of the Meta/TikTok pixels and GTM. No real participant, real code, real email send or real pixel was involved.

Re-run them yourself:

```bash
npm test                                   # 64 server tests (real Postgres)
node quiz-private/verify-bank.js           # question bank checks
DEV_STUB_PIXELS=1 node server/dev-server.js --build frontend/build &   # local site + API
node server/test/browser-e2e.js && node server/test/browser-tracking.js   # real-browser suites
```

## Summary

| Suite | Result |
|---|---|
| Question bank verification (48 questions, 3 languages, puzzles recomputed independently) | pass |
| Server tests against a real PostgreSQL (`npm test`) | **64 / 64 pass** |
| Real-browser end-to-end (Chromium, phone viewport) | **8 / 8 pass** |
| Consent-aware tracking in a real browser | **8 / 8 pass** |
| Music control in a real browser (separate build, generated test tone) | pass |
| Full production build including prerender | pass (14/14 routes, `spa-shell.html` written) |

## What each requirement was checked with

| Requirement | Evidence |
|---|---|
| Score boundaries 0-2 / 3-4 / 5 give 5 / 10 / 15 % (server) | unit test of the scoring rule; server test plays attempts scoring 0,1,2,3,4,5 and checks the tier and the tier of the issued code; browser suite plays attempts across all tiers |
| 3 languages x 4 themes | browser suite plays full journeys until all 12 combinations were seen (19 journeys in the final run); for every question it compares the text on screen, and all four options, with the reviewed bank in that language |
| Opening message, no implication that everyone gets 15 % | browser suite compares the headline with the exact required sentence in EN/ES/NL; rules page shows the three tiers and that the discount depends on the score |
| Age 18+ (client and server), required fields, Prefer-not-to-say | validation unit tests (17, "17", 0, 18, 18.5, "abc", 121, empty...), server rejects before storing anything, database CHECK constraint, UI shows the under-18 message |
| Email verification, expiry, single use, lock-out | server tests: link single-use, 30-minute expiry for link and code, code locks after 5 wrong guesses, an older link dies when a newer one is issued, tokens stored hashed |
| Rate limits | server tests: per-email cooldown, per-IP, resend, verify, admin brute-force, reward resend |
| Duplicate / concurrent attempts, one reward | parallel start calls (12), parallel final answers (10), conflicting answers, 24 simultaneous completions never share a code; unique constraints verified directly in the database |
| Enumeration safety | identical responses for new, unverified, in-progress, completed and unknown addresses |
| Resume and language switching | server tests and browser check: same theme, same questions, same shuffled order, answers kept; language switch changes wording only |
| Score manipulation | extra fields in the answer request are ignored; score computed from the key snapshotted at attempt start; question edits never change a running attempt |
| Code never exposed | server tests scan every API response; browser suite and tracking suite check the page, storage, dataLayer, pixel payloads and request URLs |
| Reward email, localisation, retries, failures, exhaustion | server tests: transient failures retried with the same reward and one email; permanent failure keeps the reward, alerts the owner, admin retry; provider-side idempotency; empty tier keeps the earned reward and fulfils automatically when codes are imported |
| Delivery status honesty | webhook tests: "accepted" is never shown as delivered; delivered/bounced/complained update status; duplicates and stale replays rejected; bad signatures rejected |
| Marketing opt-in / out | box unchecked by default and never required; consent stored with wording, version, language, time; export filtered to current opt-ins; one-click unsubscribe round trip in the browser |
| Consent-aware tracking and dedupe | reject-all: nothing in dataLayer/pixels; analytics-only: dataLayer only; marketing: mapped Meta/TikTok events with the same `event_id` as the dataLayer event; no PII, codes, tokens or click ids anywhere; no Purchase event |
| noindex, sitemap | `X-Robots-Tag` in `vercel.json` and live responses, `noindex` meta in the shell, no canonical, not in sitemap/robots/llms/nav/prerender list |
| Mobile, keyboard, reduced motion, accessibility | no horizontal scroll at 320/375/414/768 px; keyboard path reaches Start and typing works with a visible focus ring and focus moving to each new heading; reduced-motion disables decorative animation; axe-core WCAG 2.1 A/AA + best practice: 0 violations on seven screens. Two real defects were found and fixed this way (duplicate `main` landmark, focus not moving between steps) |
| Music | never plays on load, step change or reload; explicit Play; visible labelled Mute/Unmute with `aria-pressed`; remembered mute |
| Owner controls | every admin endpoint returns 401 without a key; the analytics key opens only the metrics endpoint; launch gates block enabling; imports validated; erasure and retention (dry run first) |
| Measurement | metrics endpoint tested for funnel stages, question-level abandonment, email statuses, inventory, freshness, redemption import (paid vs refunded, matched by code) and that issued codes or clicks never count as purchases |

## Not tested, and why (be aware before launch)

| Not tested | Why / what to do |
|---|---|
| **Real checkout redemption** | Needs your Weeztix account. Only checked: the Weeztix short link forwards a `?coupon=` parameter to the shop. You must run a real test order per tier (checklist B) |
| **Real email sending and Resend webhooks** | No Resend key was available. The adapter is tested against a fake `fetch`; signature verification is tested with a locally signed payload. First real send and the "test webhook" button in Resend are in the launch checklist |
| **Supabase / production Postgres over SSL and the pooler** | Tested on embedded PostgreSQL 18. The code uses only transaction-scoped locks, so it is compatible with a transaction-mode pooler, but this was not exercised |
| **Vercel runtime behaviour** (function packaging, body-parser setting, cron, rewrites/headers) | Not deployable from here without your environment variables; the preview deployment is the first real test. Headers and rewrites were checked statically in `vercel.json` and mirrored in the local dev server |
| Real Meta / TikTok pixels and your GTM container | Stubbed so no test event could reach them. Verify in GTM preview (checklist D) |
| Safari, Firefox, real phones, VoiceOver/TalkBack, the on-screen keyboard | Only Chromium (headless and the in-app browser) plus axe. Inputs use 16 px text to avoid iOS zoom, but please check on a real phone |
| Real music track | None supplied; tested with a generated tone in a separate build |
| Daily report on real data | The workflow and schedule exist; it has not yet run against live Meta/TikTok/quiz data because there is no live campaign |
| Load and abuse at scale | No load test. Rate limits are per IP and per address in the database |
| Factual review by a human | Trivia was checked against sources and puzzles recomputed, but please read `quiz-private/QUESTION-BANK-REVIEW.md` |
