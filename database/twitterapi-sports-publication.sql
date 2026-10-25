-- Apply after twitterapi-sports.sql. One transaction commits imported content,
-- daily batch accounting, and the run timestamp; retries cannot lose the cap.
begin;
create or replace function public.publish_twitterapi_sports_batch(
  p_day date, p_rows jsonb, p_status text
) returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_roots text[];
  v_previous text[];
  v_total integer;
  v_unique integer;
  v_replies integer;
begin
  if p_day is null or p_day <> v_day then raise exception 'Publication requires current UTC day'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 1120 then
    raise exception 'Invalid publication collection';
  end if;
  if p_status is null or p_status not in ('partial','completed','budget_exhausted','insufficient_content') then
    raise exception 'Invalid publication status';
  end if;
  perform pg_advisory_xact_lock(4170992, 11301);
  perform 1 from public.x_sports_settings where id=1 and enabled for update;
  if not found then raise exception 'Sports import is disabled'; end if;

  select count(*), count(distinct r.x_id),
    coalesce(array_agg(r.x_id order by r.x_id) filter(where r.in_reply_to_x_id is null),'{}'::text[]),
    count(*) filter(where r.in_reply_to_x_id is not null)
    into v_total,v_unique,v_roots,v_replies
    from jsonb_populate_recordset(null::public.x_sports_posts,p_rows) r;
  if v_total <> v_unique or cardinality(v_roots) > 10 then raise exception 'Invalid unique daily roots'; end if;
  if (p_status='completed') <> (cardinality(v_roots)=10) then raise exception 'Publication status does not match root count'; end if;

  select root_ids into v_previous from public.twitterapi_sports_batches where day=p_day for update;
  if v_previous is not null and not (v_previous <@ v_roots) then
    raise exception 'Publication cannot replace previous daily roots';
  end if;
  -- Recheck structural and time invariants at the database boundary. Arabic
  -- news/ad/profanity classification remains in the shared importer/feed filter.
  if exists (
    select 1 from jsonb_populate_recordset(null::public.x_sports_posts,p_rows) r
    where r.x_id is null or r.language is distinct from 'ar'
      or r.is_visible is distinct from true or r.deleted_at is not null
      or r.links_json is distinct from '[]'::jsonb
      or r.matched_query is null or r.matched_query not like 'twitterapi:news:%'
      or r.posted_at is null or not isfinite(r.posted_at) or r.posted_at > now()+interval '5 minutes'
      or r.expires_at is null or not isfinite(r.expires_at) or r.expires_at <= now()
      or (r.in_reply_to_x_id is null and (r.conversation_id is distinct from r.x_id or r.posted_at < now()-interval '24 hours'))
      or (r.in_reply_to_x_id is not null and (not (r.in_reply_to_x_id=any(v_roots)) or r.conversation_id is distinct from r.in_reply_to_x_id))
  ) then raise exception 'Invalid publication rows'; end if;
  if exists (
    select 1 from unnest(v_roots) root_id
    left join jsonb_populate_recordset(null::public.x_sports_posts,p_rows) r on r.in_reply_to_x_id=root_id
    group by root_id having count(r.x_id) not between 20 and 111
  ) then raise exception 'Invalid actual comment count'; end if;
  if exists (
    select 1 from jsonb_populate_recordset(null::public.x_sports_posts,p_rows) child
    join jsonb_populate_recordset(null::public.x_sports_posts,p_rows) parent on child.in_reply_to_x_id=parent.x_id
    where child.posted_at < parent.posted_at
  ) then raise exception 'Reply predates its root'; end if;

  insert into public.x_sports_posts (
    x_id,conversation_id,in_reply_to_x_id,author_x_id,author_username,
    author_name,author_avatar_url,body,language,media_json,links_json,
    posted_at,imported_at,last_synced_at,expires_at,is_visible,deleted_at,matched_query
  ) select r.x_id,r.conversation_id,r.in_reply_to_x_id,r.author_x_id,r.author_username,
    r.author_name,r.author_avatar_url,r.body,r.language,r.media_json,r.links_json,
    r.posted_at,now(),now(),r.expires_at,r.is_visible,r.deleted_at,r.matched_query
    from jsonb_populate_recordset(null::public.x_sports_posts,p_rows) r
  on conflict (x_id) do update set
    conversation_id=excluded.conversation_id,in_reply_to_x_id=excluded.in_reply_to_x_id,
    author_x_id=excluded.author_x_id,author_username=excluded.author_username,
    author_name=excluded.author_name,author_avatar_url=excluded.author_avatar_url,
    body=excluded.body,language=excluded.language,media_json=excluded.media_json,
    links_json=excluded.links_json,posted_at=excluded.posted_at,last_synced_at=excluded.last_synced_at,
    is_visible=excluded.is_visible,deleted_at=excluded.deleted_at,matched_query=excluded.matched_query;
  -- imported_at and expires_at deliberately remain unchanged on conflict.
  insert into public.twitterapi_sports_batches(day,status,root_ids,roots,replies,updated_at)
    values(p_day,p_status,v_roots,cardinality(v_roots),v_replies,now())
    on conflict(day) do update set status=excluded.status,root_ids=excluded.root_ids,
      roots=excluded.roots,replies=excluded.replies,updated_at=excluded.updated_at;
  update public.x_sports_settings set last_run_at=now() where id=1;
  return jsonb_build_object('roots',cardinality(v_roots),'replies',v_replies,'status',p_status);
end;
$$;
revoke all on function public.publish_twitterapi_sports_batch(date,jsonb,text) from public,anon,authenticated;
grant execute on function public.publish_twitterapi_sports_batch(date,jsonb,text) to service_role;
commit;
