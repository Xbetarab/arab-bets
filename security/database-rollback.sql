-- Restore the reviewed baseline privileges/policies only if emergency rollback is needed.
-- WARNING: this restores confirmed exploitable public RPC and protected-column grants.
-- Contains the original hardcoded admin-policy identity from metadata; keep private.
BEGIN;
GRANT EXECUTE ON FUNCTION
  public.admin_create_ghost_profile(text,text,text,text),
  public.admin_ghost_comment(uuid,uuid,text,uuid),
  public.admin_set_comment_likes(uuid,integer),
  public.admin_set_post_likes(uuid,integer),
  public.decrement_comment_likes(uuid),
  public.decrement_post_likes(uuid),
  public.handle_new_user(),
  public.increment_comment_likes(uuid),
  public.increment_post_comments(uuid),
  public.increment_post_likes(uuid),
  public.rls_auto_enable()
TO PUBLIC,anon,authenticated;
REVOKE INSERT ("id","username","display_name","bio","avatar_url","cover_url","country","is_verified","is_private","role","stats","created_at","updated_at"), UPDATE ("id","username","display_name","bio","avatar_url","cover_url","country","is_verified","is_private","role","stats","created_at","updated_at") ON public.profiles FROM PUBLIC,anon,authenticated;
GRANT INSERT, UPDATE ON public.profiles TO anon,authenticated;
REVOKE INSERT ("id","author_id","content","post_type","media_urls","tags","sport","match_ref","is_pinned","likes_count","comments_count","reposts_count","created_at","updated_at","is_approved","tip_data"), UPDATE ("id","author_id","content","post_type","media_urls","tags","sport","match_ref","is_pinned","likes_count","comments_count","reposts_count","created_at","updated_at","is_approved","tip_data") ON public.posts FROM PUBLIC,anon,authenticated;
GRANT INSERT, UPDATE ON public.posts TO anon,authenticated;
REVOKE INSERT ("id","post_id","author_id","parent_id","content","likes_count","created_at","is_approved"), UPDATE ("id","post_id","author_id","parent_id","content","likes_count","created_at","is_approved") ON public.comments FROM PUBLIC,anon,authenticated;
GRANT INSERT, UPDATE ON public.comments TO anon,authenticated;
GRANT UPDATE ON public.app_settings TO anon,authenticated;
DROP POLICY "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() = id));
CREATE POLICY "admin_update_posts" ON public.posts AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'uomankotd@gmail.com'::text))));
CREATE POLICY "admin_update_comments" ON public.comments AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'uomankotd@gmail.com'::text))));
DROP POLICY "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'post-media'::text));
DROP POLICY "authenticated_upload" ON storage.objects;
CREATE POLICY "authenticated_upload" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'post-media'::text));
DROP POLICY "allow_authenticated_insert_avatars" ON storage.objects;
CREATE POLICY "allow_authenticated_insert_avatars" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'avatars'::text));
DROP POLICY "allow_authenticated_insert_covers" ON storage.objects;
CREATE POLICY "allow_authenticated_insert_covers" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'covers'::text));
DROP POLICY "allow_authenticated_update_avatars" ON storage.objects;
CREATE POLICY "allow_authenticated_update_avatars" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING ((bucket_id = 'avatars'::text));
DROP POLICY "allow_authenticated_update_covers" ON storage.objects;
CREATE POLICY "allow_authenticated_update_covers" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING ((bucket_id = 'covers'::text));
NOTIFY pgrst, 'reload schema';
COMMIT;
