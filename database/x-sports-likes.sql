-- Imported-feed reactions only. Native posts/likes/profiles/admin stay unchanged.
begin;
alter table public.x_sports_posts add column if not exists seeded_likes_count integer;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.x_sports_posts'::regclass and conname='x_sports_posts_seeded_likes_range') then
    alter table public.x_sports_posts add constraint x_sports_posts_seeded_likes_range
      check(seeded_likes_count is null or seeded_likes_count between 124 and 998);
  end if;
end $$;

create or replace function public.preserve_x_sports_seeded_likes()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  if new.in_reply_to_x_id is not null then
    new.seeded_likes_count := null;
  elsif tg_op='UPDATE' and old.in_reply_to_x_id is null and old.seeded_likes_count is not null then
    -- Even an import that sends NULL/a fresh seed cannot overwrite a root's
    -- existing baseline. The value is assigned once, never on page rendering.
    new.seeded_likes_count := old.seeded_likes_count;
  elsif new.seeded_likes_count is null then
    new.seeded_likes_count := 124+floor(random()*875)::integer;
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_x_sports_seeded_likes() from public,anon,authenticated;
grant execute on function public.preserve_x_sports_seeded_likes() to service_role;
drop trigger if exists x_sports_seed_likes_before_write on public.x_sports_posts;
create trigger x_sports_seed_likes_before_write before insert or update on public.x_sports_posts
  for each row execute function public.preserve_x_sports_seeded_likes();
update public.x_sports_posts set seeded_likes_count=null where in_reply_to_x_id is null and seeded_likes_count is null;
update public.x_sports_posts set seeded_likes_count=null where in_reply_to_x_id is not null and seeded_likes_count is not null;

create table if not exists public.x_sports_post_likes (
  post_id text not null references public.x_sports_posts(x_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create index if not exists x_sports_post_likes_user_idx on public.x_sports_post_likes(user_id);
alter table public.x_sports_post_likes enable row level security;
revoke all on public.x_sports_post_likes from public,anon,authenticated;
grant select,insert,delete on public.x_sports_post_likes to service_role;

create or replace function public.set_x_sports_post_like(
  p_post_id text,p_user_id uuid,p_liked boolean
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
  v_seed integer;
  v_count bigint;
begin
  if p_post_id is null or p_post_id !~ '^[0-9]{1,25}$' or p_user_id is null or p_liked is null then
    raise exception 'Invalid imported like input';
  end if;
  -- The dedicated import table cannot resolve a native post. Locking the
  -- visible root serializes all changes/counts without a mutable real counter.
  select p.seeded_likes_count into v_seed from public.x_sports_posts p
    where p.x_id=p_post_id and p.in_reply_to_x_id is null and p.conversation_id=p.x_id
      and p.is_visible and p.deleted_at is null and p.expires_at>now()
    for update;
  if not found or v_seed is null then raise exception 'X_SPORTS_POST_UNAVAILABLE'; end if;
  if p_liked then
    insert into public.x_sports_post_likes(post_id,user_id) values(p_post_id,p_user_id)
      on conflict(post_id,user_id) do nothing;
  else
    delete from public.x_sports_post_likes where post_id=p_post_id and user_id=p_user_id;
  end if;
  select count(*) into v_count from public.x_sports_post_likes where post_id=p_post_id;
  return jsonb_build_object('liked',p_liked,'likesCount',v_seed+v_count);
end;
$$;

create or replace function public.get_x_sports_post_likes(
  p_post_ids text[],p_user_id uuid default null
) returns table(post_id text,likes_count bigint,is_liked boolean)
language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  if p_post_ids is null or cardinality(p_post_ids)>20 or exists(
    select 1 from unnest(p_post_ids) item where item is null or item !~ '^[0-9]{1,25}$'
  ) then raise exception 'Invalid imported like lookup'; end if;
  return query
    select p.x_id,p.seeded_likes_count::bigint+count(l.user_id),coalesce(bool_or(l.user_id=p_user_id),false)
    from public.x_sports_posts p
    left join public.x_sports_post_likes l on l.post_id=p.x_id
    where p.x_id=any(p_post_ids) and p.in_reply_to_x_id is null and p.conversation_id=p.x_id
      and p.is_visible and p.deleted_at is null and p.expires_at>now() and p.seeded_likes_count is not null
    group by p.x_id,p.seeded_likes_count
    order by array_position(p_post_ids,p.x_id);
end;
$$;
revoke all on function public.set_x_sports_post_like(text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.get_x_sports_post_likes(text[],uuid) from public,anon,authenticated;
grant execute on function public.set_x_sports_post_like(text,uuid,boolean) to service_role;
grant execute on function public.get_x_sports_post_likes(text[],uuid) to service_role;
commit;
