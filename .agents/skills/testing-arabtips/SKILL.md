# Testing arabtips (Arab Sports Bettors Platform)

## Overview
arabtips is a Next.js 15+ social platform with Supabase backend. The admin dashboard at `/admin` includes bulk content import, ghost commenter, moderation, and counter controls.

## Devin Secrets Needed
- `SUPABASE_SERVICE_ROLE_KEY` — for server-side admin operations (stored in `.env.local`)
- `SUPABASE_MANAGEMENT_API_KEY` — for running SQL queries via `https://api.supabase.com/v1/projects/{ref}/database/query`
- VPS root password — for SSH deployment to production

## Key URLs
- Production: https://arabtips.com
- Admin dashboard: https://arabtips.com/admin
- Import page: https://arabtips.com/admin/import
- Supabase project ref: `gbokwhuvqfciopaubwod`

## Admin Access
- Admin email: `uomankotd@gmail.com` (hardcoded in `assertAdmin()`)
- Login at `/auth/login` with the admin credentials

## Testing the Import System

### Ghost Identity Pool
- Ghost identities are stored in `ghost_identities` table (currently ~942 entries)
- The importer MUST only use identities from this table
- Old/deleted ghost profiles in `profiles` table must NEVER be used
- Verify with: `SELECT username FROM ghost_identities WHERE username = 'xxx';`

### Import Flow Testing
1. Login as admin → navigate to `/admin/import`
2. Upload JSON file via "استيراد منشورات مع تعليقات" section
3. Click "استيراد المنشورات" button
4. Wait for success message showing post/comment/profile counts

### Database Verification via Supabase Management API
Use the Management API to run SQL queries for verification:
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/gbokwhuvqfciopaubwod/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR SQL HERE"}'
```

### Key Verification Queries
- **Check if username is in ghost pool:** `SELECT EXISTS(SELECT 1 FROM ghost_identities WHERE username = 'xxx') as in_pool;`
- **Find newest imported post:** Look at `profiles.created_at` DESC to find recently created ghost profiles, then join to posts
- **Verify all comment authors in pool:** `SELECT pr.username, CASE WHEN g.username IS NOT NULL THEN true ELSE false END as in_ghost_pool FROM comments c JOIN profiles pr ON c.author_id = pr.id LEFT JOIN ghost_identities g ON pr.username = g.username WHERE c.post_id = 'POST_ID';`
- **Important:** Import uses `created_at` from the JSON file, NOT the current time. So finding newly imported posts requires checking `profiles.created_at` (which uses actual insertion time) rather than `posts.created_at`.

## Production Deployment
```bash
sshpass -p '$VPS_PASSWORD' ssh -o StrictHostKeyChecking=no root@108.61.178.186 \
  "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && \
  cd /root/arab-bets && npm run build 2>&1 | tail -15 && pm2 restart arab-bets"
```
Note: `npm` and `pm2` require nvm to be sourced in non-interactive SSH sessions.

## Common Pitfalls
- The VPS SSH session doesn't load nvm automatically — always source it first
- `pm2 logs` also requires nvm to be sourced
- The admin UI is RTL (Arabic) — button labels are in Arabic
- Profile cache pre-loading filters to pool-only usernames — this is intentional to prevent stale profile reuse
- The `computeTimestamp` function may shift future timestamps to the past — always verify with actual DB queries
