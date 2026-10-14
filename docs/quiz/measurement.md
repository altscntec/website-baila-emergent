# Halloween quiz: metric definitions

Source of every number: `GET /api/admin/metrics?from=<ISO>&to=<ISO>` (aggregate JSON, no personal data), plus ad-platform data. Windows are half-open `[from, to)`. Time zone for daily buckets is Europe/Amsterdam.

## Funnel (each rate states its denominator)

| Metric | Numerator | Denominator | Source label |
|---|---|---|---|
| Click-to-landing loss | link clicks minus `landing_view` | link clicks (Meta/TikTok) | platform-reported vs observed; landing counters exclude bots and are cookieless, so a gap of a few % is normal |
| Start CTA rate | `start_click` | `landing_view` | observed (counters) |
| Form completion | people with `form_success` | people with `start_click` | observed. The counters and the funnel table are different sources; the report prints both |
| Verification rate | people with `verification_completed` | people with `form_success` | observed |
| Quiz start rate | `quiz_started` | `verification_completed` | observed |
| Quiz completion | `quiz_completed` | `quiz_started` | observed |
| Question-level abandonment | at position *n*: viewed minus answered | viewed | observed (`positions`, `questions`) |
| Reward issued | `reward_issued` | `quiz_completed` | observed |
| Email problems | outbox rows `failed/bounced/complained` | reward emails created | observed (provider webhooks) |
| Discount distribution | completed attempts by tier | completed attempts | observed |
| Code redemption rate | codes with at least one paid imported order | codes issued | **inferred**, only from imported orders |
| Lead-to-purchase | purchasers | verified participants (cohort created in window) | inferred |
| Opted-in lead-to-purchase | opted-in purchasers | opted-in verified participants | inferred |

Cohort metrics (`leads`) use participants **created** in the window. Stage metrics use funnel events **occurring** in the window. Mixing them is deliberate and labelled; do not divide one by the other.

## Cost metrics

Spend, impressions, link clicks, CPM, CPC, link CTR come from the ad platforms only (Meta connector, TikTok export). They are never estimated.

| Metric | Formula | Needs |
|---|---|---|
| Cost per verified lead | spend / verified participants | spend, funnel |
| Cost per ticket purchaser | spend / distinct purchasers (paid, not refunded) | spend + imported orders |
| New-customer CAC | spend / purchasers **who are not previous ticket buyers** | **not computable** from this data: we do not know prior purchase history. The report must say so and show cost per purchaser instead |
| ROAS | net revenue from imported orders / spend | spend + imported orders with net amounts |
| Contribution | net revenue minus costs | only if the owner supplies costs; otherwise omitted |

Cost per lead is never presented as CAC. Meta and TikTok each report conversions on their own attribution windows; the workflow never adds the two together, and uses the code-matched purchases from imported orders as the single purchase count (a purchaser is counted once, under the channel stored on their participant record).

## Attribution caveats

* Purchases are matched to a participant through the discount code, so a purchase is attributed to the campaign the participant **arrived from** (first touch captured at signup). It says nothing about whether the quiz or the ad **caused** the purchase.
* **No incrementality claims.** Recommend a controlled comparison (for example geo or audience holdout, or a split with and without the quiz offer) before judging causal lift.
* People can use several email addresses; one person can therefore appear as several participants. The `suspiciousRepeats` block is a heuristic (same name, city, country and age), not proof.
* Browser events depend on consent and ad blockers; server events do not, but only start once the form is submitted.

## Freshness fields the report must print

`freshness.lastFunnelEvent`, `freshness.lastEmailWebhook`, `freshness.lastRedemptionImport`, `freshness.lastCounterDay`, plus the date of the newest TikTok export file and the Meta connector's reporting date range. A stale redemption import means purchases are under-reported, not zero.
