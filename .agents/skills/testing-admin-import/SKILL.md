# Testing: Admin Bulk Content Import

## Overview
The bulk content import feature at `/admin/import` allows uploading JSON files to create posts with comments or add comments to existing posts.

## Devin Secrets Needed
- Admin login credentials (email + password) for https://arabtips.com
- `SUPABASE_SERVICE_ROLE_KEY` — used server-side by import actions to bypass RLS

## Prerequisites
- Must be logged in as admin (email-gated: only `uomankotd@gmail.com`)
- Navigate to https://arabtips.com/admin/import
- Feature is deployed to production VPS at 108.61.178.186

## Test File Formats

### Posts + Comments JSON
```json
{
  "posts": [
    {
      "author_username": "some_username",
      "content": "Post content in Arabic",
      "sport": "كرة قدم",
      "created_at": "2026-04-15T10:00:00Z",
      "likes_count": 42,
      "comments": [
        {
          "author_username": "commenter_username",
          "content": "Comment text",
          "created_at": "2026-04-15T11:00:00Z",
          "likes_count": 5,
          "replies": [
            {
              "author_username": "replier_username",
              "content": "Reply text",
              "created_at": "2026-04-15T12:00:00Z",
              "likes_count": 2
            }
          ]
        }
      ]
    }
  ]
}
```

### Comments-Only JSON
```json
{
  "comments": [
    {
      "post_id": "uuid-of-existing-post",
      "entries": [
        {
          "author_username": "commenter_username",
          "content": "Comment text",
          "created_at": "2026-04-16T09:00:00Z",
          "likes_count": 7
        }
      ]
    }
  ]
}
```

## Sport Values
Valid sport labels (Arabic or English): كرة قدم, سلة, كرة سلة, تنس, ملاكمة, فنون قتالية, MMA, رياضات إلكترونية, كريكت, أخرى, football, basketball, tennis, boxing, mma, esports, other

## Testing Steps

1. **Login** as admin at `/auth/login`
2. **Navigate** to `/admin/import`
3. **Verify UI**: Two upload sections visible, both import buttons disabled when no file selected
4. **Upload posts+comments JSON** to Section 1:
   - Verify preview shows correct post count, comment count, unique usernames
   - Click import, verify success banner with correct counts
   - Verify ghost profiles auto-created for new usernames
5. **Verify on feed**: Navigate to home `/` and find imported post. Check likes_count, comments_count, sport tag, author name
6. **Verify on permalink**: Click into post, verify comments are threaded correctly with correct like counts
7. **Test error handling**: Upload invalid JSON, verify Arabic error message appears
8. **Test comments-only import** in Section 2: Use post_id from a previously created post

## Known Behaviors
- **Client-side preview**: Invalid JSON fails silently (no preview shown) but the import button may remain enabled. Server-side validation catches the error and returns an Arabic message.
- **ISR caching**: The home feed may briefly show stale `comments_count` after import. The post permalink always shows the correct value. This resolves on page refresh.
- **Ghost profile auto-creation**: If `author_username` doesn't exist, a ghost profile is created via `admin_create_ghost_profile` RPC with `display_name` derived from the username (underscores replaced with spaces).
- **No rollback on partial failure**: If post 5 of 20 fails, posts 1-4 are already committed. There is no transaction wrapper.
- **Server action body size limit**: Very large JSON files (50+ posts with hundreds of comments) may exceed Next.js server action body size limit (~1MB default).
- **All imported content is auto-approved** (`is_approved = true`) — it bypasses the moderation queue.

## Deployment
After code changes, deploy to VPS:
```bash
ssh root@108.61.178.186
cd /root/arab-bets && git pull && npm install && npm run build && pm2 restart arab-bets
```
