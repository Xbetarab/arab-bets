# Arabic sports news importer

The existing homepage feed reads private `x_sports_posts`. Native posts, profiles,
admin capabilities, affiliate routes, and the image proxy are unchanged.

## Daily selection

- Target: 10 new Arabic sports news/event posts from the previous 24 hours.
- Publish each post only with 20–111 genuine, unique direct Arabic replies.
- Prefer 350 total comments, allocating extra comments by source engagement.
  Actual counts depend on available clean replies; counts are never invented.
- Filter promotions, giveaways, insults, profanity, source branding/links, and
  non-Arabic text. Unsupported media evidence causes rejection.
- Strip automatic leading `@replyaddressee` tokens in both import and display;
  keep author names/avatars and meaningful mentions within the reply body.
- Imported content retains the existing 48-hour visibility period.

## Cost and execution

- Provider: TwitterAPI.io, 15 credits per returned tweet, minimum 15 per request.
  100,000 credits equals $1 (verified 2026-10-21).
- Budget reservations cap the importer at 11,300 credits per UTC day and 339,000
  credits across 30 UTC days ($0.113 and $3.39 at the verified price).
- Reserve conservatively before a request. Uncertain requests retain the full
  reservation; never retry a paid request automatically. Cache completed reads.
- Exhausted budget or insufficient clean content produces a smaller batch;
  ten posts are a target, not a reason to exceed the cap or invent comments.
- The local reply-page reservation assumes at most 100 records. Provider docs
  state 20 but an observed response contained 42. An unexpected larger response
  stops the importer. Exact media response structure still needs live proof.
- No automatic recharge. Daily service is `arabtips-x-sports.timer`, using
  `sync-twitterapi-sports.mjs` at 00:30 UTC (03:30 Baghdad), without catch-up.
- Store the provider key in a private file via `TWITTERAPI_KEY_FILE`, never in
  browser-exposed settings. `TWITTERAPI_IMPORT_ENABLED=true` enables the job;
  `X_IMPORT_ENABLED=true` retains the existing feed feature switch.
- State directory: `/var/lib/arabtips-twitterapi`; date directories mode 700,
  JSON files mode 600. Old importer-owned cache folders are pruned after 3 days.

## Deployment and recovery

Apply `database/twitterapi-sports.sql`, `sports-reply-limit-111.sql`, then
`twitterapi-sports-publication.sql`. The publication RPC commits rows, daily
batch accounting, and last_run_at together. All new tables/RPCs are private to
service_role with SECURITY INVOKER; browser roles receive no access.

`--preview` makes metered reads and updates the usage ledger but does not publish.
`--offline --preview --seed-trial=/absolute/path` reuses trial cache without API.
`--publish-cache` validates and atomically publishes the current-day batch,
without reading a provider key or making provider calls. A completed day is
skipped. Partial retries preserve the day's previously published roots.

The 2026-10-21 trial cost (11,295 credits) is already recorded. The initial live
seed initially contained 51 replies. Final browser review excluded 12 missed
local insult/curse phrases, leaving one news post with 39 visible replies. The
moderation rules now cover those variants. No additional provider reads occurred.
