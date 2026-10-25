# Temporary sports feed import (local draft)

The isolated database migration was applied to the production Supabase project
on 20 October 2026 and verified with its switch disabled. The application has
not been deployed and no paid API request has been made. The migration does
not alter local profiles, ghost-account imports, or `/admin` authorization.
Public access is off by default at both the app and database layers.
The imported tables grant no access to browser roles; server-rendered pages
read with the service role and return only the approved public fields.

## Activation sequence for an authorized deployment

1. Review the provider's display and storage terms before publication. The
   requested anonymous public presentation may require a change before launch.
2. The migration has been applied to project `gbokwhuvqfciopaubwod`; its
   role/RLS verification passed. Do not reapply it.
3. Put `X_BEARER_TOKEN` in a server-only `.env.local`; never use `NEXT_PUBLIC_`
   for it. The existing `SUPABASE_SERVICE_ROLE_KEY` must also stay server-only.
4. Set `X_IMPORT_ENABLED=true` in the server runtime. Change
   `public.x_sports_settings.enabled` to true after review. Either switch can
   immediately stop new imports and hide the public feed.
5. Run `node --env-file=.env.local scripts/sync-x-sports.mjs` once in a
   single server process. The script checks the live API balance before any
   paid call and returns `insufficient_balance` when it cannot cover a page.
6. Schedule that exact command once per UTC day on the single application
   host. The CLI holds an operating-system `flock` lock across the entire run
   so a manual invocation cannot overlap the scheduler. Do not invoke the
   exported function from another process or deploy a second scheduler host;
   it has no distributed database lease. The database `last_run_at` value
   prevents a second successful daily run.

The default batch today (20 October 2026 UTC) searches two Champions League
fixture/language groups, including PSG–Barcelona and other matches, plus one
current sports trend. A two-per-fixture selection cap favors different matches
when recent search returns them. On later days it uses current football
competition terms plus a current trend. Override
the search strings with `X_SPORTS_QUERIES` as a JSON array of 1–5 strings,
and the trend region with numeric `X_SPORTS_WOEID` (default 1, worldwide).
Every search starts at that UTC day's midnight; old results cannot enter the
daily batch. The page itself displays only active rows that have not expired.

## Cost and moderation

The default database limits are 3 roots/run, 5 stored replies/root, 60 returned
Post reads/day, and 48 hours' retention. The worker searches up to three
topics, then gives separate reply pages to different match roots before
continuing pagination. Because recent search returns at least 10 results per
request, a full daily batch can cost roughly $0.91 in a worst case with 60
Post reads, 60 distinct author reads and a trend call.
The worker may use fewer reads if search has fewer results or older copies
consume part of the cap. These are conservative planning
figures, not a provider invoice. With a $5 prepaid balance and automatic
recharge off, that is about five full-budget daily runs. The worker
checks `/2/usage/credits` before paid calls and stops if the balance cannot
cover a full page; the X console's billing cap remains the external control.

The worker rejects obvious fake-stream promotions, link farms, source-platform
mentions/links, sensitive or protected posts, short content, and duplicate
text within a run. This heuristic cannot prove credibility. Imported items are
kept in a separate table under the original public author's name/avatar and
never attributed to ArabTips users. Existing copies are rechecked for edits,
deletion, and protection on later runs; a missing item is hidden. The
48-hour expiry also removes abandoned copies from public queries. A dedicated
removal flow is still needed for urgent takedown requests between daily runs.

## Verification

Run `npm run test:sports`, `npm run lint`, and `npm run build` after installing
dependencies. Test the SQL/RLS file against a disposable Supabase project,
then a single low-cost API request with the server-only token before enabling
the scheduled worker.
