-- All statements below only inspect metadata, not personal rows.
WITH targets AS (
  SELECT p.oid, p.oid::regprocedure::text AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef
)
SELECT signature,
  NOT has_function_privilege('anon',oid,'EXECUTE') AS anon_blocked,
  NOT has_function_privilege('authenticated',oid,'EXECUTE') AS authenticated_blocked,
  has_function_privilege('service_role',oid,'EXECUTE') AS service_role_preserved
FROM targets ORDER BY signature;

WITH expected(signature,original_md5) AS (
  VALUES
    ('public.admin_create_ghost_profile(text,text,text,text)','cc89e68a168f5dd6d89d914af14c89be'),
    ('public.admin_ghost_comment(uuid,uuid,text,uuid)','3a36be9e6495ff2ae760dbfd9823198d'),
    ('public.admin_set_comment_likes(uuid,integer)','f320d7392d919557b89cf1b088045945'),
    ('public.admin_set_post_likes(uuid,integer)','0988fbf24169ba2ac4a42615229e93eb')
)
SELECT signature, md5(pg_get_functiondef(to_regprocedure(signature)))=original_md5 AS admin_function_body_preserved
FROM expected ORDER BY signature;

WITH protected(table_name,column_name) AS (
  VALUES
    ('profiles','role'),('profiles','is_verified'),('profiles','stats'),
    ('profiles','id'),('profiles','created_at'),('profiles','updated_at'),
    ('posts','is_approved'),('posts','is_pinned'),('posts','likes_count'),
    ('posts','comments_count'),('posts','reposts_count'),
    ('comments','is_approved'),('comments','likes_count'),('comments','author_id'),
    ('app_settings','value')
)
SELECT table_name,column_name,
  NOT has_column_privilege('anon','public.'||table_name,column_name,'UPDATE') AS anon_update_blocked,
  NOT has_column_privilege('authenticated','public.'||table_name,column_name,'UPDATE') AS client_update_blocked,
  has_column_privilege('service_role','public.'||table_name,column_name,'UPDATE') AS service_role_update_preserved
FROM protected ORDER BY table_name,column_name;

SELECT
  has_column_privilege('authenticated','public.profiles','display_name','UPDATE') AS profile_edit_preserved,
  has_column_privilege('authenticated','public.profiles','avatar_url','UPDATE') AS avatar_edit_preserved,
  NOT has_any_column_privilege('authenticated','public.posts','UPDATE') AS direct_post_update_blocked,
  NOT has_any_column_privilege('authenticated','public.comments','UPDATE') AS direct_comment_update_blocked,
  has_column_privilege('service_role','public.posts','tip_data','UPDATE') AS server_owner_tip_settle_preserved,
  has_column_privilege('service_role','public.profiles','stats','UPDATE') AS admin_ghost_allocation_preserved,
  NOT has_column_privilege('authenticated','public.profiles','role','INSERT') AS role_insert_blocked,
  NOT has_column_privilege('authenticated','public.profiles','is_verified','INSERT') AS verified_insert_blocked,
  NOT has_column_privilege('authenticated','public.posts','is_approved','INSERT') AS post_approval_insert_blocked,
  NOT has_column_privilege('authenticated','public.comments','is_approved','INSERT') AS comment_approval_insert_blocked,
  NOT has_any_column_privilege('authenticated','public.posts','INSERT') AS direct_post_insert_blocked,
  NOT has_any_column_privilege('authenticated','public.comments','INSERT') AS direct_comment_insert_blocked,
  NOT has_table_privilege('authenticated','auth.users','SELECT') AS auth_emails_private;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies
WHERE (schemaname='storage' AND policyname IN (
  'Allow authenticated uploads','authenticated_upload',
  'allow_authenticated_insert_avatars','allow_authenticated_insert_covers',
  'allow_authenticated_update_avatars','allow_authenticated_update_covers'))
  OR (schemaname='public' AND policyname='profiles_update')
ORDER BY schemaname,tablename,policyname;

SELECT NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname='public' AND policyname IN ('admin_update_posts','admin_update_comments')
) AS unsafe_duplicate_update_policies_removed;

SELECT n.nspname,c.relname,c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r'
ORDER BY c.relname;
