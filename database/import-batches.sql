-- Additive admin import workspace. Existing functions, counters and grants are untouched.
-- Apply once as a reviewed migration. All callers must be authenticated by the
-- server's existing primary-admin guard before using its service-role client.
begin;

create table public.admin_import_batches (
  id uuid primary key default gen_random_uuid(),
  input_hash text not null unique check (input_hash ~ '^[a-f0-9]{64}$'),
  label text not null check (length(label) between 1 and 250),
  mode text not null check (mode in ('posts','comments')),
  status text not null default 'draft' check (status in ('draft','running','paused','completed','partial')),
  plan jsonb not null check (jsonb_typeof(plan) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A receipt survives content deletion: resuming must never resurrect deleted
-- content. It also deduplicates the same item inside a different input file.
create table public.admin_import_receipts (
  fingerprint text primary key,
  content_id uuid not null unique,
  kind text not null check (kind in ('post','comment')),
  batch_id uuid not null references public.admin_import_batches(id),
  item_key text not null,
  author_id uuid not null,
  manual_likes integer not null check (manual_likes >= 0),
  published_at timestamptz not null default now(),
  unique (batch_id,item_key)
);
create index admin_import_batches_recent_idx on public.admin_import_batches(created_at desc);
create index admin_import_receipts_author_idx on public.admin_import_receipts(author_id);
alter table public.admin_import_batches enable row level security;
alter table public.admin_import_receipts enable row level security;
revoke all on public.admin_import_batches, public.admin_import_receipts from public, anon, authenticated;
grant select, insert, update, delete on public.admin_import_batches, public.admin_import_receipts to service_role;

create function public.admin_import_validate_plan(p_plan jsonb, p_mode text, p_strict_pool boolean default true)
returns jsonb language plpgsql security invoker set search_path = '' set timezone = 'UTC' as $$
declare
  item jsonb; normalized jsonb := '[]'; previous jsonb; parent_item jsonb;
  seen_keys text[] := '{}'; seen_ids uuid[] := '{}';
  stamp timestamptz; post_stamp timestamptz; item_id uuid;
  ghost_name text; current_state text;
begin
  if p_mode not in ('posts','comments') or p_mode is null then raise exception 'نوع الدفعة غير صالح'; end if;
  if jsonb_typeof(p_plan) is distinct from 'array' then raise exception 'خطة الدفعة غير صالحة'; end if;
  if jsonb_array_length(p_plan) not between 1 and 2000 then raise exception 'يجب أن تحتوي الدفعة على 1 إلى 2000 عنصر'; end if;
  for item in select value from jsonb_array_elements(p_plan) loop
    if jsonb_typeof(item) is distinct from 'object' or nullif(item->>'key','') is null or length(item->>'key') > 1000 then raise exception 'معرّف عنصر غير صالح'; end if;
    if item->>'key' = any(seen_keys) then raise exception 'معرّف عنصر مكرر: %', item->>'key'; end if;
    if item->>'kind' is null or item->>'kind' not in ('post','comment') then raise exception 'نوع عنصر غير صالح'; end if;
    if p_mode = 'comments' and item->>'kind' = 'post' then raise exception 'دفعة التعليقات لا تقبل منشورات'; end if;
    item_id := (item->>'id')::uuid;
    if item_id is null or item_id = any(seen_ids) then raise exception 'معرّف محتوى مفقود أو مكرر'; end if;
    current_state := coalesce(item->>'state','pending');
    if current_state not in ('pending','failed','published','duplicate') then raise exception 'حالة عنصر غير صالحة'; end if;
    if jsonb_typeof(item->'content') is distinct from 'string' or nullif(btrim(item->>'content'),'') is null then raise exception 'محتوى العنصر مطلوب'; end if;
    if coalesce(item->>'likesCount','') !~ '^[0-9]+$' or (item->>'likesCount')::numeric > 2147483647 then raise exception 'عدد الإعجابات يجب أن يكون عدداً صحيحاً غير سالب'; end if;
    stamp := (item->>'createdAt')::timestamptz;
    if stamp is null or not isfinite(stamp) or stamp > now() + interval '60 seconds' then raise exception 'تاريخ العنصر غير صالح أو في المستقبل'; end if;
    item := item || jsonb_build_object('warnings',coalesce((select jsonb_agg(w) from jsonb_array_elements(coalesce(item->'warnings','[]')) w where w #>> '{}' not in ('التعليق يسبق المنشور زمنياً','الرد يسبق التعليق الأب زمنياً','الهوية لم تعد موجودة في المخزون الحالي','المنشور المستهدف محذوف أو غير موجود')),'[]'));
    if item->>'kind' = 'post' then
      if item->>'postKey' is not null or item->>'parentKey' is not null or item->>'targetPostId' is not null then raise exception 'روابط المنشور غير صالحة'; end if;
      if item->>'sport' is not null and item->>'sport' not in ('football','basketball','tennis','boxing','mma','esports','other') then raise exception 'نوع الرياضة غير صالح'; end if;
    else
      if (item->>'postKey' is null) = (item->>'targetPostId' is null) then raise exception 'يجب تحديد منشور واحد للتعليق'; end if;
      if item->>'postKey' is not null then
        select value into previous from jsonb_array_elements(normalized) where value->>'key' = item->>'postKey';
        if previous is null or previous->>'kind' <> 'post' then raise exception 'منشور التعليق غير موجود أو ترتيبه غير صحيح'; end if;
        post_stamp := (previous->>'createdAt')::timestamptz;
      else
        select created_at into post_stamp from public.posts where id = (item->>'targetPostId')::uuid;
        if not found and current_state not in ('published','duplicate') then
          if p_strict_pool then raise exception 'المنشور المستهدف غير موجود'; end if;
          item := item || jsonb_build_object('warnings',(item->'warnings') || jsonb_build_array('المنشور المستهدف محذوف أو غير موجود'));
        end if;
      end if;
      if stamp < post_stamp then item := item || jsonb_build_object('warnings',(item->'warnings') || jsonb_build_array('التعليق يسبق المنشور زمنياً')); end if;
      if item->>'parentKey' is not null then
        select value into parent_item from jsonb_array_elements(normalized) where value->>'key' = item->>'parentKey';
        if parent_item is null or parent_item->>'kind' <> 'comment'
          or parent_item->>'postKey' is distinct from item->>'postKey'
          or parent_item->>'targetPostId' is distinct from item->>'targetPostId' then raise exception 'التعليق الأب غير صالح أو تابع لمنشور آخر'; end if;
        if stamp < (parent_item->>'createdAt')::timestamptz then item := item || jsonb_build_object('warnings',(item->'warnings') || jsonb_build_array('الرد يسبق التعليق الأب زمنياً')); end if;
      end if;
    end if;
    if current_state not in ('published','duplicate') then
      select display_name into ghost_name from public.ghost_identities where username = item->>'username';
      if not found then
        if p_strict_pool then raise exception 'الهوية لم تعد موجودة في المخزون الحالي: %', item->>'username'; end if;
        item := item || jsonb_build_object('warnings',(item->'warnings') || jsonb_build_array('الهوية لم تعد موجودة في المخزون الحالي'));
      else
        item := item || jsonb_build_object('displayName',ghost_name);
      end if;
    end if;
    item := item || jsonb_build_object('createdAt',to_char(stamp at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'state',current_state);
    normalized := normalized || jsonb_build_array(item);
    seen_keys := array_append(seen_keys,item->>'key');
    seen_ids := array_append(seen_ids,item_id);
  end loop;
  return normalized;
end;
$$;

create function public.admin_import_create(p_input_hash text, p_label text, p_mode text, p_plan jsonb, p_warnings jsonb, p_created_by uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare b public.admin_import_batches; clean_plan jsonb;
begin
  -- Lock identical input creation too, so the winning plan is stable on retries.
  perform pg_advisory_xact_lock(hashtextextended('admin-import-input:' || p_input_hash,0));
  select * into b from public.admin_import_batches where input_hash = p_input_hash;
  if found then return to_jsonb(b); end if;
  select jsonb_agg(value || jsonb_build_object('state','pending','error',null,'publishedId',null) order by ordinality)
    into clean_plan from jsonb_array_elements(p_plan) with ordinality;
  clean_plan := public.admin_import_validate_plan(clean_plan,p_mode);
  insert into public.admin_import_batches(input_hash,label,mode,plan,warnings,created_by)
  values (p_input_hash,p_label,p_mode,clean_plan,coalesce(p_warnings,'[]'),p_created_by) returning * into b;
  return to_jsonb(b);
end;
$$;

create function public.admin_import_edit(p_batch_id uuid, p_key text, p_changes jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare b public.admin_import_batches; item jsonb; item_index integer; prop text;
begin
  select * into b from public.admin_import_batches where id = p_batch_id for update;
  if not found then raise exception 'الدفعة غير موجودة'; end if;
  if b.status in ('running','completed') then raise exception 'أوقف الدفعة قبل تعديل عناصرها غير المنشورة'; end if;
  if jsonb_typeof(p_changes) is distinct from 'object' then raise exception 'تعديل غير صالح'; end if;
  for prop in select jsonb_object_keys(p_changes) loop
    if prop not in ('content','username','createdAt','likesCount','sport') then raise exception 'هذا الحقل غير قابل للتعديل'; end if;
  end loop;
  select value, (ordinality-1)::integer into item,item_index
    from jsonb_array_elements(b.plan) with ordinality where value->>'key' = p_key;
  if not found then raise exception 'العنصر غير موجود'; end if;
  if item->>'state' in ('published','duplicate') then raise exception 'العنصر المنشور ثابت في سجل الدفعة'; end if;
  if p_changes ? 'username' and not exists(select 1 from public.ghost_identities where username=p_changes->>'username') then raise exception 'الهوية المختارة ليست في المخزون الحالي'; end if;
  item := item || p_changes || jsonb_build_object('state','pending','error',null);
  b.plan := jsonb_set(b.plan,array[item_index::text],item);
  -- Validating the entire plan catches descendants that now precede this edit.
  b.plan := public.admin_import_validate_plan(b.plan,b.mode,false);
  update public.admin_import_batches set plan=b.plan,updated_at=now() where id=b.id returning * into b;
  return to_jsonb(b);
end;
$$;

create function public.admin_import_control(p_batch_id uuid, p_action text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare b public.admin_import_batches;
begin
  select * into b from public.admin_import_batches where id=p_batch_id for update;
  if not found then raise exception 'الدفعة غير موجودة'; end if;
  if p_action is null or p_action not in ('start','pause','resume') then raise exception 'عملية غير صالحة'; end if;
  if b.status='completed' then return to_jsonb(b); end if;
  if p_action='pause' then
    b.status := 'paused';
  elsif b.status <> 'running' then
    -- Retry failures only after an explicit start/resume, never in an endless loop.
    select jsonb_agg(case when value->>'state'='failed' then value || jsonb_build_object('state','pending','error',null) else value end order by ordinality)
      into b.plan from jsonb_array_elements(b.plan) with ordinality;
    b.status := 'running';
  end if;
  update public.admin_import_batches set status=b.status,plan=b.plan,updated_at=now() where id=b.id returning * into b;
  return to_jsonb(b);
end;
$$;

create function public.admin_import_step(p_batch_id uuid, p_limit integer default 10)
-- Legacy ghost creation and insert triggers expect extension functions and
-- public relations. Both schemas are existing trusted schemas; pg_catalog and
-- extensions precede public so a public name cannot shadow their functions.
returns jsonb language plpgsql security invoker set search_path = pg_catalog, extensions, public set timezone = 'UTC' as $$
<<batch_publish>>
declare
  b public.admin_import_batches; item jsonb; dep jsonb; item_index integer;
  ghost public.ghost_identities; author uuid; new_profile boolean;
  content_id uuid; post_id uuid; parent_id uuid; stamp timestamptz; dependency_stamp timestamptz;
  fingerprint text; existing public.admin_import_receipts; attempted integer:=0; failure text;
begin
  select * into b from public.admin_import_batches where id=p_batch_id for update;
  if not found then raise exception 'الدفعة غير موجودة'; end if;
  if b.status <> 'running' then return to_jsonb(b); end if;
  if p_limit is null or p_limit not between 1 and 10 then raise exception 'حجم خطوة النشر يجب أن يكون من 1 إلى 10'; end if;
  -- Serializing admin publishers prevents opposite-order dedup locks across
  -- batches. Batch row locking makes a pause acknowledgement a hard boundary.
  perform pg_advisory_xact_lock(hashtextextended('admin-import-publish-v1',0));
  for item_index in 0..jsonb_array_length(b.plan)-1 loop
    item := b.plan->item_index;
    if item->>'state' <> 'pending' then continue; end if;
    exit when attempted >= p_limit;
    attempted := attempted+1;
    begin
      content_id := (item->>'id')::uuid; post_id := null; parent_id := null;
      stamp := (item->>'createdAt')::timestamptz;
      if not isfinite(stamp) or stamp > now()+interval '60 seconds' then raise exception 'تاريخ العنصر غير صالح أو في المستقبل'; end if;
      if item->>'kind'='comment' then
        if item->>'postKey' is not null then
          select value into dep from jsonb_array_elements(b.plan) where value->>'key'=item->>'postKey';
          if dep->>'state' is null or dep->>'state' not in ('published','duplicate') then raise exception 'لم يُنشر المنشور الأب بعد'; end if;
          post_id := (dep->>'publishedId')::uuid;
        else
          post_id := (item->>'targetPostId')::uuid;
        end if;
        select created_at into dependency_stamp from public.posts where id=post_id for key share;
        if not found then raise exception 'المنشور المستهدف محذوف أو غير موجود'; end if;
        if stamp < dependency_stamp then raise exception 'التعليق يسبق المنشور زمنياً'; end if;
        if item->>'parentKey' is not null then
          select value into dep from jsonb_array_elements(b.plan) where value->>'key'=item->>'parentKey';
          if dep->>'state' is null or dep->>'state' not in ('published','duplicate') then raise exception 'لم يُنشر التعليق الأب بعد'; end if;
          parent_id := (dep->>'publishedId')::uuid;
          select created_at into dependency_stamp from public.comments where id=batch_publish.parent_id and comments.post_id=batch_publish.post_id for key share;
          if not found then raise exception 'التعليق الأب محذوف أو تابع لمنشور آخر'; end if;
          if stamp < dependency_stamp then raise exception 'الرد يسبق التعليق الأب زمنياً'; end if;
        end if;
      end if;
      fingerprint := encode(sha256(convert_to(jsonb_build_object(
        'kind',item->>'kind','content',item->>'content','createdAt',stamp,
        'likesCount',(item->>'likesCount')::integer,'sport',case when item->>'kind'='post' then item->>'sport' else null end,
        'postId',post_id,'parentId',parent_id)::text,'UTF8')),'hex');
      select * into existing from public.admin_import_receipts r where r.fingerprint=batch_publish.fingerprint;
      if found then
        item := item || jsonb_build_object('state','duplicate','publishedId',existing.content_id,'error',null);
        select p.username,p.display_name into ghost.username,ghost.display_name from public.profiles p where p.id=existing.author_id;
        if found then item := item || jsonb_build_object('username',ghost.username,'displayName',ghost.display_name); end if;
      else
        -- Lock the current identity so a simultaneous pool deletion cannot race.
        select * into ghost from public.ghost_identities where username=item->>'username' for share;
        if not found then raise exception 'الهوية لم تعد موجودة في المخزون الحالي'; end if;
        select id into author from public.profiles where username=ghost.username;
        new_profile := not found;
        if new_profile then
          author := public.admin_create_ghost_profile(p_username=>ghost.username,p_display_name=>ghost.display_name,p_avatar_url=>null,p_bio=>null);
          -- Existing importer initialization, only for newly created profiles.
          update public.profiles set
            created_at=timestamptz '2024-01-15 00:00:00+00' + random()*(timestamptz '2025-12-20 23:59:59+00'-timestamptz '2024-01-15 00:00:00+00'),
            stats=jsonb_build_object('posts',0,'followers',floor(random()*33)::integer,'following',15+floor(random()*39)::integer)
          where id=author;
        end if;
        if item->>'kind'='post' then
          insert into public.posts(id,author_id,content,sport,is_approved,created_at,likes_count,comments_count)
            values(content_id,author,item->>'content',item->>'sport',true,stamp,(item->>'likesCount')::integer,0);
        else
          insert into public.comments(id,post_id,parent_id,author_id,content,is_approved,created_at,likes_count)
            values(content_id,post_id,parent_id,author,item->>'content',true,stamp,(item->>'likesCount')::integer);
        end if;
        -- Content and receipt commit together; triggers alone manage counters.
        insert into public.admin_import_receipts(fingerprint,content_id,kind,batch_id,item_key,author_id,manual_likes)
          values(fingerprint,content_id,item->>'kind',b.id,item->>'key',author,(item->>'likesCount')::integer);
        item := item || jsonb_build_object('state','published','publishedId',content_id,'error',null,'displayName',ghost.display_name);
      end if;
    exception when others then
      get stacked diagnostics failure = message_text;
      item := item || jsonb_build_object('state','failed','error',left(failure,500),'publishedId',null);
    end;
    b.plan := jsonb_set(b.plan,array[item_index::text],item);
  end loop;
  if exists(select 1 from jsonb_array_elements(b.plan) i where i->>'state'='failed') then
    b.status := 'partial';
  elsif not exists(select 1 from jsonb_array_elements(b.plan) i where i->>'state'='pending') then
    b.status := 'completed';
  end if;
  update public.admin_import_batches set plan=b.plan,status=b.status,updated_at=now() where id=b.id returning * into b;
  return to_jsonb(b);
end;
$$;

create function public.admin_import_stats(p_batch_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with items as (
    select distinct (i->>'publishedId')::uuid id, i->>'kind' kind
    from public.admin_import_batches b cross join lateral jsonb_array_elements(b.plan) i
    where b.id=p_batch_id and i->>'state' in ('published','duplicate')
  ), managed_authors as (
    select p.id from public.profiles p join public.ghost_identities g on g.username=p.username
    union select author_id from public.admin_import_receipts
  ), reactions as (
    select l.user_id from public.likes l join items i on i.kind='post' and i.id=l.target_id and l.target_type='post'
    union all
    select l.user_id from public.comment_likes l join items i on i.kind='comment' and i.id=l.comment_id
  )
  select jsonb_build_object(
    'manualLikes',coalesce((select sum(r.manual_likes) from public.admin_import_receipts r join items i on i.id=r.content_id),0),
    'relationshipLikes',(select count(*) from reactions),
    'memberRelationshipLikes',(select count(*) from reactions r where not exists(select 1 from managed_authors m where m.id=r.user_id)),
    'managedRelationshipLikes',(select count(*) from reactions r where exists(select 1 from managed_authors m where m.id=r.user_id)),
    'managedPosts',(select count(*) from items i join public.posts p on p.id=i.id where i.kind='post'),
    'managedComments',(select count(*) from items i join public.comments c on c.id=i.id where i.kind='comment'),
    'memberReplies',(select count(*) from public.comments c where not exists(select 1 from managed_authors m where m.id=c.author_id)
      and (exists(select 1 from items i where i.kind='post' and i.id=c.post_id) or exists(select 1 from items i where i.kind='comment' and i.id=c.parent_id))),
    'deletedItems',(select count(*) from items i where (i.kind='post' and not exists(select 1 from public.posts p where p.id=i.id)) or (i.kind='comment' and not exists(select 1 from public.comments c where c.id=i.id)))
  );
$$;

create function public.admin_import_history(p_limit integer default 30)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(summary order by created_at desc),'[]'::jsonb) from (
    select b.created_at, jsonb_build_object('id',b.id,'label',b.label,'mode',b.mode,'status',b.status,
      'createdAt',b.created_at,'updatedAt',b.updated_at,'total',jsonb_array_length(b.plan),
      'published',(select count(*) from jsonb_array_elements(b.plan) i where i->>'state'='published'),
      'duplicates',(select count(*) from jsonb_array_elements(b.plan) i where i->>'state'='duplicate'),
      'failed',(select count(*) from jsonb_array_elements(b.plan) i where i->>'state'='failed'),
      'pending',(select count(*) from jsonb_array_elements(b.plan) i where i->>'state'='pending')) summary
    from public.admin_import_batches b
    where b.status <> 'completed' or b.id in (
      select id from public.admin_import_batches where status='completed' order by created_at desc limit least(greatest(coalesce(p_limit,30),1),100)
    )
  ) summaries;
$$;

revoke all on function public.admin_import_validate_plan(jsonb,text,boolean), public.admin_import_create(text,text,text,jsonb,jsonb,uuid), public.admin_import_edit(uuid,text,jsonb), public.admin_import_control(uuid,text), public.admin_import_step(uuid,integer), public.admin_import_stats(uuid) from public, anon, authenticated;
grant execute on function public.admin_import_validate_plan(jsonb,text,boolean), public.admin_import_create(text,text,text,jsonb,jsonb,uuid), public.admin_import_edit(uuid,text,jsonb), public.admin_import_control(uuid,text), public.admin_import_step(uuid,integer), public.admin_import_stats(uuid) to service_role;
revoke all on function public.admin_import_history(integer) from public, anon, authenticated;
grant execute on function public.admin_import_history(integer) to service_role;
comment on table public.admin_import_batches is 'Primary-admin import preview and resumable publication history; service-role access only.';
comment on table public.admin_import_receipts is 'Atomic deduplication receipts for new admin import batches; not a historical backfill.';
notify pgrst, 'reload schema';
commit;
