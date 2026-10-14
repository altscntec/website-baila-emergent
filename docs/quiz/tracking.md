# Halloween quiz: tracking and event mapping

Everything below is implemented in `frontend/src/quiz/analytics.js` (browser) and `server/services/*` (server).
Nothing here is a mock. Items marked **awaiting configuration** need an account/setting only you can supply.

## Principles

| Rule | How it is enforced |
|---|---|
| Respect cookie consent | Browser events are pushed to `dataLayer` only if the visitor accepted **analytics or marketing** (the same rule that loads GTM today). Meta/TikTok events only fire if **marketing** was accepted, through the pixels the site already loads (`window.fbq` / `window.ttq`). |
| No personal data in analytics | `quizTrack()` drops every key that is not on an allowlist (`theme, language, question_id, position, tier, score_band, status, step, error_code, duration_ms, fields, kind`). `fields` carries only field names plus error codes (e.g. `age:under_18`), never values. Automated tests check the server-side events table for names, emails, cities, codes and tokens. |
| No tokens or codes in URLs/analytics | The email link carries its token in the URL **fragment** (`#t=`), which `earlyBoot.js` moves into memory and removes from the address bar before React renders and before GTM can load. Discount codes never reach the browser at all. |
| No double counting | The site already loads Meta + TikTok pixels by hand. **Do not add Meta or TikTok base-pixel tags in GTM** (see "GTM setup"). Each quiz event has a random `event_id` that is sent to `dataLayer`, to `fbq(..., {eventID})` and to `ttq.track(..., {event_id})`, so any future server-side (Conversions API / Events API) copy of the same event can be deduplicated by the platforms. |
| Ticket click and issued code are not purchases | There is no `Purchase` event in the browser. Tickets are sold on the Weeztix shop, outside our site. Purchases are known only from the order export you import (below). |

## Event schema

All events carry `campaign_id: "halloween_quiz_2026"` plus the campaign UTMs the visitor arrived with (`utm_source, utm_medium, utm_campaign, utm_content`).

| `dataLayer` event | When | Extra params | Meta | TikTok |
|---|---|---|---|---|
| `quiz_landing_view` | Quiz page loads | `language` | (PageView already fires from the existing pixel) | (page already fires) |
| `quiz_language_selected` | Language chosen/switched | `language` | | |
| `quiz_start_click` | "Start the challenge" (the quiz begins immediately, no form first) | `language` | custom `QuizStart` | `ClickButton` |
| `quiz_started` | Attempt created (anonymous browser session) | `theme`, `language` | | |
| `quiz_question_viewed` | Each question shown | `theme`, `question_id`, `position` | | |
| `quiz_answer_submitted` | Answer locked (no correctness) | `theme`, `question_id`, `position`, `duration_ms` | | |
| `quiz_completed` | Final answer; score and tier shown | `theme`, `tier`, `score_band` | custom `QuizCompleted` (value = tier %) | |
| `quiz_discount_earned` | Same moment | `theme`, `tier` | | |
| `quiz_form_validation_error` | Claim form rejected (client or server) | `fields` (names:codes), `kind` | | |
| `quiz_form_success` | Claim form (shown after the score) accepted by server | `language` | custom `QuizSignup` | |
| `quiz_verification_requested` | Email sent / re-sent | `language`, `kind` | | |
| `quiz_verification_completed` | Code or link verified; the code is issued and emailed at this moment | `language`, `kind` | `Lead` | `SubmitForm` |
| `quiz_verification_failed` | Bad/expired code or link | `error_code` | | |
| `quiz_reward_email_status` | After verification and when status changes | `status` (`queued/accepted/delivered/bounced/failed/...`), `tier` | | |
| `quiz_ticket_click` | "Open the ticket shop" | `tier`, `language` | `InitiateCheckout` | `InitiateCheckout` |
| `quiz_error` | Unexpected failure | `step`, `error_code` | | |

`score_band` is `low | mid | top` (5 / 10 / 15 %). Question IDs are the stable bank IDs (`MOV-001`...), which carry no answer information.

### Server-side counterpart (first-party, always on, no cookies, no personal data)

These are written by the API into `quiz.funnel_events` (anonymous id only) and `quiz.daily_counters` (aggregate):

`quiz_started, question_viewed, answer_submitted, quiz_completed, form_success, form_rejected, verification_requested, verification_completed, discount_earned, reward_issued, reward_pending_inventory, reward_email_status, reward_resend` and the cookieless counters `landing_view`, `start_click` (by campaign / source / medium / content / language; bots excluded by user-agent; no IP, no user agent and no identifier is stored).

The server events are the source of truth for the daily report. The browser events feed GA4/Meta/TikTok optimisation. Differences between the two are expected (consent, ad blockers) and the daily report prints them side by side rather than merging them.

## Attribution

Captured on landing (`attribution.js`), kept in `sessionStorage` for the tab, sent once with the signup form, stored on the participant and re-used for the checkout link in the reward email.

Allowlisted: `utm_source, utm_medium, utm_campaign, utm_content, utm_term`, `meta_campaign_id, meta_adset_id, meta_ad_id`, `tiktok_campaign_id, tiktok_adgroup_id, tiktok_ad_id`, `landing_path` (path only), `referrer_host` (host only), and `fbclid` / `ttclid` **only when marketing consent is granted**. Everything else is dropped; values are length- and charset-limited.

Checkout hand-off: the reward email links to the Weeztix shop with `?coupon=CODE` plus the **UTM subset only** (never click ids, never ids of people) and `bd_ref=quiz_reward`. The Weeztix short link was tested: it forwards `coupon` and the other query parameters to the shop page.

### URL templates for your ads (put these in the ad's "URL parameters" / tracking template)

Meta (Ads Manager, URL parameters):

```
utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&meta_campaign_id={{campaign.id}}&meta_adset_id={{adset.id}}&meta_ad_id={{ad.id}}
```

TikTok (Ads Manager, URL parameters; `ttclid` is appended automatically):

```
utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__&tiktok_campaign_id=__CAMPAIGN_ID__&tiktok_adgroup_id=__AID__&tiktok_ad_id=__CID__
```

Use the quiz URL itself as the destination, for example `https://bailadembow.com/halloween/quiz`.

## GTM setup (container `GTM-M3Z7P43H`)

GTM already loads on analytics or marketing consent. For the quiz, configure it as the management layer like this:

1. **Triggers**: one Custom Event trigger per event name above (or a single regex trigger `^quiz_`).
2. **Variables**: Data Layer Variables for `theme, language, tier, score_band, question_id, position, status, step, error_code, duration_ms, fields, campaign_id, utm_*`.
3. **GA4 tags**: one GA4 event tag that sends `{{Event}}` with those parameters, fired on the `^quiz_` trigger. Mark `quiz_verification_completed` and `quiz_completed` as key events.
4. **Meta / TikTok: do not create base or event tags in GTM.** The site already loads both pixels in code on marketing consent, and the quiz events above are already mapped to them with matching `event_id`s. Adding GTM tags for the same pixel IDs would double count. If you later prefer GTM to own the ad-platform tags, remove the `PIXEL_MAP` block in `analytics.js` first, then build the tags in GTM from the same `dataLayer` events and pass `{{event_id}}`.
5. **Consent**: GTM only loads after consent, so no extra consent configuration is needed for the above. Any ad-remarketing tag you add later should also use GTM consent mode (`ad_storage`).

Status: **implemented in code; awaiting your GTM container edits** (GA4 property/measurement ID and the triggers above). Nothing in GTM was changed from here.

## Purchases, redemptions and revenue

| Item | Status |
|---|---|
| Discount code issued | Available (server). Not a purchase. |
| Ticket-shop click | Browser event for the in-page button only. Not a purchase. Clicks on the link inside the reward email go straight to Weeztix and are **not observable** by us. |
| **Code redemption / completed purchase / net revenue / refunds** | **Awaiting data.** The Weeztix dashboard shows who used which code in *Orders, Order list*, and the API documents Coupon/CouponCode resources, but we found no documented, confirmed webhook that includes the coupon code, and no documented way to receive orders on our side. The supported path today is: export the order list from Weeztix and paste it into **Quiz admin, Import ticket orders** (or `POST /api/admin/redemptions/import`). Column names are configurable because the real export header has not been confirmed. Until you import, the report states "purchase data unavailable". |
| Meta / TikTok purchase conversions | **Not available.** The purchase happens on Weeztix. Reporting it to the platforms would need either a pixel/GTM container configured inside the Weeztix shop settings, or server-side Conversions API / Events API calls driven by the imported orders (with the consent and hashing questions that implies). Neither was built, so no purchase is reported to Meta or TikTok. |
| ROAS / cost per purchaser | Computed by the daily workflow only when both spend (Meta connector / TikTok export) and imported orders exist for the same window. |

Attribution labels used in reports: **observed** (first-party server data), **platform-reported** (Meta/TikTok numbers), **inferred** (derived from codes, e.g. purchaser matched via code), **unavailable**.
