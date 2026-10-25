-- APPLIED ONCE to gbokwhuvqfciopaubwod as arabtips_security_hardening_20261006.
-- Applied after verified application cutover; post-deployment metadata checks passed.
-- DO NOT RE-RUN: one-time policy changes are not idempotent. Run verification only.
-- All /admin RPCs and mutations use service_role after server-side assertAdmin().
-- This retains full service_role privileges, all ghost/admin function bodies,
-- ghost allocations, identifiers, generated data, and manual admin counters.
BEGIN;

-- Definer RPCs are implementation details of trusted server actions.
-- PUBLIC must be revoked too, otherwise its inherited EXECUTE defeats the change.
REVOKE EXECUTE ON FUNCTION
  public.admin_create_ghost_profile(text,text,text,text),
  public.admin_ghost_comment(uuid,uuid,text,uuid),
  public.admin_set_comment_likes(uuid,integer),
  public.admin_set_post_likes(uuid,integer),
  public.decrement_comment_likes(uuid),
  public.decrement_post_likes(uuid),
  public.increment_comment_likes(uuid),
  public.increment_post_comments(uuid),
  public.increment_post_likes(uuid),
  public.handle_new_user(),
  public.rls_auto_enable(),
  public.get_auth_users_for_analytics()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.admin_create_ghost_profile(text,text,text,text),
  public.admin_ghost_comment(uuid,uuid,text,uuid),
  public.admin_set_comment_likes(uuid,integer),
  public.admin_set_post_likes(uuid,integer),
  public.decrement_comment_likes(uuid),
  public.decrement_post_likes(uuid),
  public.increment_comment_likes(uuid),
  public.increment_post_comments(uuid),
  public.increment_post_likes(uuid),
  public.handle_new_user(),
  public.rls_auto_enable(),
  public.get_auth_users_for_analytics()
TO service_role;

-- Remove table-wide grants first; revoking individual columns alone is ineffective.
-- Metadata confirms no pre-existing explicit column ACLs or inherited client roles.
REVOKE INSERT, UPDATE ON public.profiles, public.posts, public.comments
FROM PUBLIC, anon, authenticated;

-- Owners retain ordinary profile edits. Server-only fields: role, is_verified,
-- stats, identity and timestamps. Actual public.profiles has no is_ghost column.
GRANT INSERT (id, username, display_name, bio, avatar_url, cover_url, country, is_private)
ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url, cover_url, country, is_private)
ON public.profiles TO authenticated;
ALTER POLICY profiles_update ON public.profiles
  WITH CHECK ((SELECT auth.uid()) = id);

-- All post/comment INSERT and UPDATE writes use authenticated, owner-verified
-- server actions with service_role. This includes owner tip settlement.
-- Runtime validation, canonical tip fields and moderation cannot be bypassed
-- by directly changing JSON or content through the client Data API.

-- These duplicate client policies query auth.users, to which authenticated has
-- no SELECT grant. Primary admin moderation already uses the service role.
DROP POLICY admin_update_posts ON public.posts;
DROP POLICY admin_update_comments ON public.comments;

-- The settings UI also uses assertAdmin() + service_role. This removes reliance
-- on any previously forged public.profiles.role for settings writes.
REVOKE UPDATE ON public.app_settings FROM PUBLIC, anon, authenticated;

-- Keep public images readable and restrict user uploads to the user's namespace.
-- Preserve all preset and ghost buckets/policies and all existing objects.
ALTER POLICY "Allow authenticated uploads" ON storage.objects
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
ALTER POLICY authenticated_upload ON storage.objects
  WITH CHECK (
    bucket_id = 'post-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
ALTER POLICY allow_authenticated_insert_avatars ON storage.objects
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
ALTER POLICY allow_authenticated_insert_covers ON storage.objects
  WITH CHECK (
    bucket_id = 'covers'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
ALTER POLICY allow_authenticated_update_avatars ON storage.objects
  USING (
    bucket_id = 'avatars'
    AND owner_id = (SELECT auth.uid()::text)
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND owner_id = (SELECT auth.uid()::text)
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
ALTER POLICY allow_authenticated_update_covers ON storage.objects
  USING (
    bucket_id = 'covers'
    AND owner_id = (SELECT auth.uid()::text)
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'covers'
    AND owner_id = (SELECT auth.uid()::text)
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

NOTIFY pgrst, 'reload schema';
COMMIT;
