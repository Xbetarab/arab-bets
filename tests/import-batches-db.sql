-- Isolated PostgreSQL/PGlite fixture only. NEVER execute against production.
create role anon;
create role authenticated;
create role service_role bypassrls;
grant usage on schema public to service_role;
create schema extensions;
create function extensions.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;
grant usage on schema extensions to service_role;
grant execute on function extensions.uuid_generate_v4() to service_role;
create table public.profiles(id uuid primary key default gen_random_uuid(),username text unique,display_name text,created_at timestamptz default now(),stats jsonb);
create table public.ghost_identities(id uuid primary key default gen_random_uuid(),username text unique,display_name text,activity_weight numeric default .5,role_preference text default 'balanced');
create table public.posts(id uuid primary key default gen_random_uuid(),author_id uuid references profiles,content text check (content <> 'fixture_reject'),sport text,is_approved boolean,created_at timestamptz,likes_count integer default 0,comments_count integer default 0);
create table public.comments(id uuid primary key default gen_random_uuid(),post_id uuid references posts on delete cascade,parent_id uuid references comments on delete cascade,author_id uuid references profiles,content text check (content <> 'fixture_reject'),is_approved boolean,created_at timestamptz,likes_count integer default 0);
create type public.like_target as enum ('post','comment');
create table public.likes(user_id uuid references profiles,target_id uuid,target_type public.like_target);
create table public.comment_likes(user_id uuid references profiles,comment_id uuid references comments on delete cascade);
create function public.fixture_count_comment() returns trigger language plpgsql as $$ begin update public.posts set comments_count=comments_count+1 where id=new.post_id; return new; end; $$;
create trigger fixture_comment_insert after insert on public.comments for each row execute function public.fixture_count_comment();
create function public.admin_create_ghost_profile(p_username text,p_display_name text,p_avatar_url text default null,p_bio text default null)
returns uuid language plpgsql as $$ declare v uuid; begin insert into profiles(id,username,display_name) values(uuid_generate_v4(),p_username,p_display_name) returning id into v; return v; end; $$;
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
insert into profiles(id,username,display_name,created_at,stats) values
 ('11111111-1111-4111-8111-111111111111','existing','اسم موجود','2020-01-01', '{"posts":42,"followers":500,"following":600}'),
 ('22222222-2222-4222-8222-222222222222','member','عضو حقيقي','2020-01-01','{}');
insert into ghost_identities(username,display_name) values('existing','اسم موجود'),('newghost','هوية جديدة'),('rollbackghost','هوية المعاملة');

-- APPLY MIGRATION HERE --

create table fixture_results(name text primary key,passed boolean not null);
create function fixture_expect(p_name text,p_ok boolean) returns void language plpgsql as $$ begin
 if p_ok is distinct from true then raise exception 'FAILED: %',p_name; end if;
 insert into fixture_results values(p_name,true);
end; $$;
create function fixture_item(p_key text,p_kind text,p_content text,p_time text,p_likes integer,p_post_key text default null,p_parent_key text default null,p_target uuid default null,p_username text default 'existing')
returns jsonb language sql as $$ select jsonb_build_object('id',gen_random_uuid(),'key',p_key,'kind',p_kind,'content',p_content,'createdAt',p_time,'likesCount',p_likes,'postKey',p_post_key,'parentKey',p_parent_key,'targetPostId',p_target,'sport',case when p_kind='post' then 'football' else null end,'username',p_username,'displayName','supplied name','state','pending','error',null,'publishedId',null,'warnings','[]'::jsonb) $$;
create function fixture_create(p_hash text,p_plan jsonb,p_mode text default 'posts') returns jsonb language sql as $$ select public.admin_import_create(repeat(p_hash,64),'اختبار',p_mode,p_plan,'[]','22222222-2222-4222-8222-222222222222') $$;

do $$
#variable_conflict use_variable
declare b jsonb; same_batch jsonb; result jsonb; plan jsonb; batch_id uuid; post_id uuid; child_id uuid; reply_id uuid; rejected boolean; before_posts integer; begin
 perform fixture_expect('tables have RLS',(select bool_and(relrowsecurity) from pg_class where relname in ('admin_import_batches','admin_import_receipts')));
 perform fixture_expect('anonymous table access blocked',not has_table_privilege('anon','admin_import_batches','SELECT') and not has_table_privilege('authenticated','admin_import_receipts','INSERT'));
 perform fixture_expect('RPC execution blocked for clients',not has_function_privilege('anon','public.admin_import_step(uuid,integer)','EXECUTE') and not has_function_privilege('authenticated','public.admin_import_control(uuid,text)','EXECUTE'));
 perform fixture_expect('RPCs use invoker rights',(select bool_and(not prosecdef) from pg_proc where proname like 'admin_import_%'));

 plan:=jsonb_build_array(fixture_item('p','post','المنشور الأول','2026-01-01T10:00:00Z',40),fixture_item('c','comment','تعليق أول','2026-01-01T10:01:00Z',7,'p',null,null,'newghost'),fixture_item('r','comment','رد متسلسل','2026-01-01T10:02:00Z',3,'p','c'));
 b:=fixture_create('a',plan); batch_id:=(b->>'id')::uuid;
 perform fixture_expect('preview creates no public content',(select count(*)=0 from posts) and (select count(*)=0 from comments) and (select count(*)=2 from profiles));
 same_batch:=fixture_create('a',jsonb_build_array(fixture_item('other','post','irrelevant','2026-01-01',0)));
 perform fixture_expect('same input retry returns original plan',same_batch=b);

 result:=fixture_create('b',jsonb_build_array(fixture_item('p','post','bad chronology','2026-01-02',0),fixture_item('c','comment','too early','2026-01-01',0,'p')));
 perform fixture_expect('chronology warning is available in draft',jsonb_array_length(result->'plan'->1->'warnings')>0);
 result:=admin_import_edit((result->>'id')::uuid,'c','{"createdAt":"2026-01-03T00:00:00Z"}');
 perform fixture_expect('chronology warning can be corrected before publishing',jsonb_array_length(result->'plan'->1->'warnings')=0);
 result:=admin_import_edit(batch_id,'p','{"createdAt":"2026-01-01T10:02:00Z"}');
 perform fixture_expect('editing parent regenerates descendant warnings',jsonb_array_length(result->'plan'->1->'warnings')>0);
 perform admin_import_edit(batch_id,'p','{"createdAt":"2026-01-01T10:00:00Z"}');

 perform admin_import_control(batch_id,'start'); b:=admin_import_step(batch_id,1); post_id:=(b->'plan'->0->>'publishedId')::uuid;
 perform fixture_expect('one step publishes exactly one item',b->>'status'='running' and (select count(*)=1 from posts) and (select count(*)=0 from comments));
 perform admin_import_control(batch_id,'pause'); b:=admin_import_step(batch_id,10);
 perform fixture_expect('pause acknowledgement prevents later publication',b->>'status'='paused' and (select count(*)=0 from comments));
 rejected:=false; begin perform admin_import_edit(batch_id,'p','{"content":"overwrite"}'); exception when others then rejected:=true; end;
 perform fixture_expect('published items immutable in history',rejected);
 perform admin_import_control(batch_id,'resume'); b:=admin_import_step(batch_id,10);
 child_id:=(b->'plan'->1->>'publishedId')::uuid; reply_id:=(b->'plan'->2->>'publishedId')::uuid;
 perform fixture_expect('resume completes exactly remaining items',b->>'status'='completed' and (select count(*)=1 from posts) and (select count(*)=2 from comments));
 perform fixture_expect('comment mapping and single trigger count',(select parent_id=child_id and comments.post_id=post_id from comments where id=reply_id) and (select comments_count=2 from posts where id=post_id));
 perform fixture_expect('manual likes and custom dates retained',(select likes_count=40 and created_at='2026-01-01T10:00:00Z' from posts where id=post_id) and (select likes_count=7 from comments where id=child_id));
 perform fixture_expect('existing profile untouched',(select created_at='2020-01-01' and stats='{"posts":42,"followers":500,"following":600}'::jsonb from profiles where username='existing'));
 perform fixture_expect('new profile legacy initialization retained',(select created_at between '2024-01-15' and '2025-12-20 23:59:59+00' and (stats->>'followers')::int between 0 and 32 and (stats->>'following')::int between 15 and 53 from profiles where username='newghost'));
 perform admin_import_step(batch_id,10); perform admin_import_control(batch_id,'resume'); perform admin_import_step(batch_id,10);
 perform fixture_expect('completed retries do not duplicate',(select count(*)=1 from posts) and (select count(*)=2 from comments));

 insert into likes values('22222222-2222-4222-8222-222222222222',post_id,'post'),('11111111-1111-4111-8111-111111111111',post_id,'post');
 insert into comment_likes values('22222222-2222-4222-8222-222222222222',child_id);
 insert into comments(post_id,parent_id,author_id,content,created_at) values(post_id,child_id,'22222222-2222-4222-8222-222222222222','عضو حقيقي','2026-01-01T10:03:00Z');
 result:=admin_import_stats(batch_id);
 perform fixture_expect('statistics separate baseline and real rows',(result->>'manualLikes')::int=50 and (result->>'relationshipLikes')::int=3 and (result->>'memberRelationshipLikes')::int=2 and (result->>'managedRelationshipLikes')::int=1 and (result->>'memberReplies')::int=1);

 -- Same content in another source, with different generated IDs and identities.
 plan:=jsonb_build_array(fixture_item('p','post','المنشور الأول','2026-01-01T10:00:00Z',40,null,null,null,'newghost'),fixture_item('c','comment','تعليق أول','2026-01-01T10:01:00Z',7,'p'),fixture_item('r','comment','رد متسلسل','2026-01-01T10:02:00Z',3,'p','c',null,'newghost'));
 b:=fixture_create('c',plan); perform admin_import_control((b->>'id')::uuid,'start'); b:=admin_import_step((b->>'id')::uuid,10);
 perform fixture_expect('cross-source duplicate content is linked not published',(select count(*)=1 from posts) and (select count(*)=3 from comments) and (select bool_and(i->>'state'='duplicate') from jsonb_array_elements(b->'plan') i));
 perform fixture_expect('duplicate replies map to original parent',(b->'plan'->0->>'publishedId')::uuid=post_id and (b->'plan'->1->>'publishedId')::uuid=child_id and (b->'plan'->2->>'publishedId')::uuid=reply_id);

 plan:=jsonb_build_array(fixture_item('bad','post','fixture_reject','2026-02-01',10,null,null,null,'rollbackghost'),fixture_item('good','post','good independent','2026-02-01',5));
 b:=fixture_create('d',plan); batch_id:=(b->>'id')::uuid; perform admin_import_control(batch_id,'start'); b:=admin_import_step(batch_id,10);
 perform fixture_expect('partial failure persists and successful item commits',b->>'status'='partial' and b->'plan'->0->>'state'='failed' and b->'plan'->1->>'state'='published');
 perform fixture_expect('item transaction rolls back profile and receipt',not exists(select 1 from profiles where username='rollbackghost') and not exists(select 1 from admin_import_receipts where admin_import_receipts.batch_id=batch_id and item_key='bad'));
 same_batch:=admin_import_step(batch_id,10); perform fixture_expect('failed item not retried automatically',same_batch=b);
 perform admin_import_edit(batch_id,'bad','{"content":"fixed content"}'); perform admin_import_control(batch_id,'resume'); b:=admin_import_step(batch_id,10);
 perform fixture_expect('explicit corrected resume completes once',b->>'status'='completed' and (select count(*)=1 from posts where content='fixed content') and (select count(*)=1 from posts where content='good independent'));

 plan:=jsonb_build_array(fixture_item('p','post','pool deletion','2026-03-01',0,null,null,null,'newghost'));
 b:=fixture_create('e',plan); batch_id:=(b->>'id')::uuid; delete from ghost_identities where username='newghost'; perform admin_import_control(batch_id,'start'); b:=admin_import_step(batch_id,10);
 perform fixture_expect('removed identities are never reused',b->>'status'='partial' and not exists(select 1 from posts where content='pool deletion'));
 insert into ghost_identities(username,display_name) values('newghost','هوية أعيدت'); perform admin_import_control(batch_id,'resume'); b:=admin_import_step(batch_id,10);
 perform fixture_expect('restored identity can explicitly resume',b->>'status'='completed');

 delete from posts where id=post_id;
 plan:=jsonb_build_array(fixture_item('p','post','المنشور الأول','2026-01-01T10:00:00Z',40));
 b:=fixture_create('f',plan); perform admin_import_control((b->>'id')::uuid,'start'); b:=admin_import_step((b->>'id')::uuid,10);
 perform fixture_expect('receipt prevents resurrecting deleted content',b->'plan'->0->>'state'='duplicate' and not exists(select 1 from posts where id=post_id));
 result:=admin_import_stats((b->>'id')::uuid); perform fixture_expect('deleted publication reported',(result->>'deletedItems')::int=1);

 -- Restoring the completed input works even when the pool or target changed.
 same_batch:=fixture_create('a','[]'); perform fixture_expect('old history retrievable without revalidating source',same_batch->>'status'='completed');
end; $$;

do $$
#variable_conflict use_variable
declare b jsonb; batch_id uuid; plan jsonb; target uuid; rejected boolean;
begin
 -- Missing identities do not prevent repairing the remaining items individually.
 insert into ghost_identities(username,display_name) values('willdelete','هوية مؤقتة');
 plan:=jsonb_build_array(fixture_item('a','post','repair identity one','2026-04-01',0,null,null,null,'willdelete'),fixture_item('b','post','repair identity two','2026-04-01',0,null,null,null,'willdelete'));
 b:=fixture_create('1',plan);batch_id:=(b->>'id')::uuid;delete from ghost_identities where username='willdelete';
 b:=admin_import_edit(batch_id,'a','{"username":"existing"}');
 perform fixture_expect('multiple missing identities repair individually',b->'plan'->0->>'username'='existing' and jsonb_array_length(b->'plan'->1->'warnings')>0);
 rejected:=false;begin perform admin_import_edit(batch_id,'b','{"username":"not-in-pool"}');exception when others then rejected:=true;end;
 perform fixture_expect('editing cannot select stale identity',rejected);
 b:=admin_import_edit(batch_id,'b','{"username":"existing"}');
 perform fixture_expect('identity warning clears after correction',jsonb_array_length(b->'plan'->1->'warnings')=0);

 select id into target from posts where content='good independent';
 plan:=jsonb_build_array(fixture_item('c','comment','comments-only root','2026-05-01',9,null,null,target),fixture_item('r','comment','comments-only child','2026-05-02',4,null,'c',target));
 b:=fixture_create('2',plan,'comments');batch_id:=(b->>'id')::uuid;perform admin_import_control(batch_id,'start');b:=admin_import_step(batch_id,10);
 perform fixture_expect('comments-only format preserves mapping',b->>'status'='completed' and (select parent_id=(b->'plan'->0->>'publishedId')::uuid and post_id=target from comments where id=(b->'plan'->1->>'publishedId')::uuid));

 plan:=jsonb_build_array(fixture_item('p','post','chronology execution','2026-06-02',0),fixture_item('c','comment','chronology blocked','2026-06-01',0,'p'),fixture_item('later','post','later unaffected','2026-06-02',0));
 b:=fixture_create('3',plan);batch_id:=(b->>'id')::uuid;perform admin_import_control(batch_id,'start');b:=admin_import_step(batch_id,2);
 perform fixture_expect('chronology blocks insertion and pauses with pending items',b->>'status'='partial' and b->'plan'->2->>'state'='pending' and not exists(select 1 from comments where content='chronology blocked'));
 b:=admin_import_edit(batch_id,'c','{"createdAt":"2026-06-03T00:00:00Z"}');perform admin_import_control(batch_id,'resume');b:=admin_import_step(batch_id,10);
 perform fixture_expect('corrected chronology resumes without duplicate parent',b->>'status'='completed' and (select count(*)=1 from posts where content='chronology execution'));
 perform fixture_expect('history contains summaries without content',not exists(select 1 from jsonb_array_elements(admin_import_history(2)) i where i ? 'plan' or i ? 'content'));
 perform fixture_expect('history retains every unfinished batch',(select count(*) from jsonb_array_elements(admin_import_history(2)) i where i->>'status'<>'completed')=(select count(*) from admin_import_batches where status<>'completed') and (select count(*) from jsonb_array_elements(admin_import_history(2)) i where i->>'status'='completed')=2);
 perform fixture_expect('new tables have no client RLS policies',not exists(select 1 from pg_policies where tablename in ('admin_import_batches','admin_import_receipts')));
end; $$;

-- Service-role permissions are sufficient; no security-definer workaround.
insert into public.ghost_identities(username,display_name) values('serviceghost','هوية نشر الخدمة');
set role service_role;
select public.admin_import_stats((select id from public.admin_import_batches limit 1));
do $$ declare b jsonb; begin
 b:=fixture_create('9',jsonb_build_array(fixture_item('p','post','service role publication','2026-08-01',17,null,null,null,'serviceghost'),fixture_item('c','comment','service role comment','2026-08-02',4,'p')));
 perform admin_import_control((b->>'id')::uuid,'start');b:=admin_import_step((b->>'id')::uuid,10);
 if b->>'status'<>'completed' then raise exception 'Service role publication failed: %',b; end if;
end; $$;
reset role;
select fixture_expect('service role can read and call RPC',true);
select fixture_expect('service role publishes profile post comment atomically',(select count(*)=1 from posts where content='service role publication') and (select count(*)=1 from comments where content='service role comment') and (select count(*)=1 from profiles where username='serviceghost'));
select * from fixture_results order by name;
