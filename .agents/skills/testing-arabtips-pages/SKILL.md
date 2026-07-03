---
name: testing-arabtips-pages
description: Test arab-bets/arabtips.com pages locally (public 1xbet SEO routes and authed app routes) at 375px mobile. Use when verifying UI changes, new routes, middleware/public-path behavior, or SEO metadata in this repo.
---

# Testing arabtips.com (arab-bets) pages

## Local dev server
- The app needs Supabase env vars or middleware crashes with "Your project's URL and Key are required". No `.env.local` exists on fresh boxes (`.env.example` only).
- For **public routes** (anything under `/1xbet`, `/auth/*`, `/`, `/post/*`), dummy values are enough because these pages don't hit Supabase data:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key PORT=3100 npm run dev
  ```
- For **authed routes** (feed, admin, profile), real Supabase keys are required — request them if needed.
- Use an isolated port (e.g. 3100) and never deploy/touch the Vultr server unless explicitly asked. Deploys are handled separately by the owner.

## Middleware / public paths
- `src/middleware.ts` gates routes: `publicPaths.includes(pathname)` (exact) plus `startsWith("/post/")` and `startsWith("/1xbet")`. New sub-routes under a startsWith prefix are automatically public; new top-level public routes need an explicit entry. Always verify before assuming a route is reachable logged-out.

## Repo/branch gotchas
- The GitHub default branch may not be `main` — PR tools may normalize the base; use `git_update_pr_base` to re-point to `main` if needed.
- The live Vultr server may hold uncommitted changes not in GitHub. If the repo is missing files the owner says are "live", STOP and ask — don't recreate them. A sync branch/merge to main is the owner's preferred fix.
- After pulling synced main, run `npm install` — package.json may have gained deps (e.g. framer-motion) not in local node_modules.

## Mobile testing requirements (owner preference)
- Always test at 375px width. Use the browser tool's `set_mobile` action for emulation.
- When saving screenshots with the browser tool, the parameter is `save_screenshot` (NOT `screenshot_path` — wrong names are silently ignored and no file is written; verify files exist before referencing them).
- Check: no horizontal scroll, RTL layout, full-width tappable CTAs (≥44px), readable Arabic text.

## SEO checks for /1xbet pages
- Verify via curl: `<title>`, `rel="canonical"`, `application/ld+json` FAQPage content, and `public/sitemap.xml` entries (sitemap is STATIC; there is no `src/app/sitemap.ts`).
- Watch for **duplicate FAQPage JSON-LD**: nested layouts (e.g. `src/app/1xbet/layout.tsx` wrapping sub-route layouts) can each inject a FAQPage, yielding multiple FAQPage schemas on one URL. Flag this to the owner.

## Devin Secrets Needed
- None for public-route testing (dummy Supabase env works).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for authed/admin route testing.
