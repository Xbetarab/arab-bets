# Testing arabtips.com Platform

## Overview
arabtips.com is a Next.js 15+ Arabic RTL social platform for sports betting tips. Production is deployed on a VPS via PM2 + Nginx + SSL.

## Devin Secrets Needed
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for admin operations, bypasses RLS)
- VPS root password (stored in `.env.local` on VPS at `/root/arab-bets/.env.local`)

## Environment Setup
1. Credentials are in `/home/ubuntu/repos/arab-bets/.env.local` (copied from VPS)
2. Source them: `export $(grep -v '^#' /home/ubuntu/repos/arab-bets/.env.local | xargs)`
3. Admin test account: check knowledge notes for login credentials
4. The app must be tested at **375px mobile viewport** (iPhone SE) — the owner primarily uses mobile

## How to Access Production
- **Site**: https://arabtips.com
- **VPS**: `ssh root@108.61.178.186` (source `~/.nvm/nvm.sh` before any npm commands)
- **Deploy**: `source ~/.nvm/nvm.sh && cd /root/arab-bets && git pull && npm install && npm run build && pm2 restart arab-bets`
- **Admin dashboard**: https://arabtips.com/admin (requires admin email login)

## DB Verification via Supabase REST API
Use the service role key to query data directly. Example pattern:
```python
import json, urllib.request
URL = os.environ['NEXT_PUBLIC_SUPABASE_URL']
KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
req = urllib.request.Request(f'{URL}/rest/v1/TABLE?select=COLS&FILTER', headers=H)
data = json.loads(urllib.request.urlopen(req).read())
```

Key tables:
- `profiles` — user profiles (avatar_url, username, stats JSONB with posts/followers/following)
- `ghost_identities` — ghost account usernames
- `link_clicks` — page views (link_type='page_view') and link clicks
- `posts`, `comments` — content tables

## Key Testing Flows

### Ghost Account Avatar Verification
1. Query `ghost_identities` to get all ghost usernames
2. Query `profiles` joined with ghost usernames, check `avatar_url IS NOT NULL`
3. Check for duplicate avatar URLs: `COUNT(avatar_url) GROUP BY avatar_url HAVING COUNT > 1`
4. Visually verify 2-3 ghost profiles in browser — each should show different avatar images
5. Verify ghost profiles have varied join dates (not all the same month) and randomized follower/following counts

### Real User Avatar Verification
1. Query profiles NOT in ghost_identities where avatar_url contains 'ghost-avatars' — should be 0
2. Check navbar for logged-in real user — should show letter initial (e.g. "م"), NOT an `<img>` tag
3. Check profile page — should show letter placeholder circle, NOT a ghost-avatar image

### Page View Tracking
1. Record baseline: `SELECT COUNT(*) FROM link_clicks WHERE link_type = 'page_view'`
2. Clear sessionStorage in browser: `sessionStorage.removeItem('__arabtips_pv')`
3. Navigate to site, wait 5 seconds for server action to fire
4. Re-query count — should increment by 1
5. For UTM testing: navigate to `/?utm_source=facebook&utm_medium=cpc&utm_campaign=test`
6. Check latest row's `referrer` field — should contain "facebook | cpc | test"

### Analytics Dashboard
- Navigate to `/admin/analytics`
- Click "تحديث" to force cache refresh
- Verify sections: "المستخدمون الحقيقيون", "زيارات الموقع", "نقرات الروابط", "المحتوى", "حقيقي مقابل شبحي", "التفاعل"
- "زيارات الموقع" counts should match `link_clicks WHERE link_type='page_view'`
- "نقرات الروابط" counts should match `link_clicks WHERE link_type != 'page_view'`

## Important Gotchas
- **PageViewTracker uses sessionStorage**: It only fires once per browser session. To re-trigger, clear `sessionStorage.removeItem('__arabtips_pv')` before reloading.
- **Admin client for anonymous tracking**: `trackPageView()` uses `createAdminClient()` to bypass RLS — anonymous visitors can't insert via regular client.
- **Analytics caching**: The analytics page caches results. Click "تحديث" to force refresh after making changes.
- **Profile stats field**: The profiles table uses a `stats` JSONB field (`{posts, followers, following}`), NOT separate `followers_count`/`following_count` columns.
- **No CI configured**: This repo has no CI pipeline. Testing is manual on production.
- **Mobile-first**: Owner tests on mobile. Always verify at 375px viewport before marking done.
- **RTL layout**: All UI is right-to-left Arabic. Text alignment and layout flow from right.
- **Bio field removed**: The owner removed bio/description from all profiles — do not add it back.
