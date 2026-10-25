-- Isolated billing and batch state for the single ArabTips sports importer.
-- Does not modify native posts/profiles/admin/affiliate tables.
begin;

create table if not exists public.twitterapi_sports_usage (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  endpoint text not null check (char_length(endpoint) between 1 and 100),
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  reserved_credits integer not null check (reserved_credits between 1 and 11300),
  credits integer not null check (credits >= 0 and credits <= reserved_credits),
  returned_items integer check (returned_items >= 0),
  status text not null default 'reserved' check (status in ('reserved','completed','external_trial'))
);
create index if not exists twitterapi_sports_usage_ran_idx on public.twitterapi_sports_usage(ran_at);
create unique index if not exists twitterapi_sports_external_trial_idx on public.twitterapi_sports_usage(request_hash) where status='external_trial';

create table if not exists public.twitterapi_sports_batches (
  day date primary key,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null check (status in ('preview','partial','completed','budget_exhausted','insufficient_content','failed')),
  root_ids text[] not null default '{}',
  roots integer not null default 0 check (roots between 0 and 10),
  replies integer not null default 0 check (replies between 0 and 1110),
  check (cardinality(root_ids) = roots)
);

alter table public.twitterapi_sports_usage enable row level security;
alter table public.twitterapi_sports_batches enable row level security;
revoke all on public.twitterapi_sports_usage, public.twitterapi_sports_batches from public, anon, authenticated;
grant select, insert, update on public.twitterapi_sports_usage, public.twitterapi_sports_batches to service_role;
grant usage, select on sequence public.twitterapi_sports_usage_id_seq to service_role;

-- Invoker privileges: only service_role can access the private tables/call RPCs.
-- Serializes reservations across hosts; uncertain/failed calls retain their full
-- reservation and are included in both limits. Dates come from the database.
create or replace function public.reserve_twitterapi_sports_usage(
  p_endpoint text, p_request_hash text, p_credits integer
) returns bigint language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  v_day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
  v_daily bigint; v_monthly bigint; v_id bigint;
begin
  if p_credits < 1 or p_credits > 11300 then raise exception 'Invalid credit reservation'; end if;
  perform pg_advisory_xact_lock(4170992, 11300);
  select coalesce(sum(credits) filter(where ran_at >= v_day),0), coalesce(sum(credits),0)
    into v_daily,v_monthly from public.twitterapi_sports_usage
    where ran_at >= v_day - interval '29 days';
  if v_daily + p_credits > 11300 or v_monthly + p_credits > 339000 then
    raise exception 'TWITTERAPI_BUDGET_EXHAUSTED';
  end if;
  insert into public.twitterapi_sports_usage(endpoint,request_hash,reserved_credits,credits)
    values(p_endpoint,p_request_hash,p_credits,p_credits) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.settle_twitterapi_sports_usage(
  p_id bigint, p_credits integer, p_returned_items integer
) returns void language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if p_credits < 15 or p_returned_items < 0 then raise exception 'Invalid usage settlement'; end if;
  update public.twitterapi_sports_usage set credits=p_credits,returned_items=p_returned_items,status='completed'
    where id=p_id and status='reserved' and p_credits <= reserved_credits;
  if not found then raise exception 'Usage reservation unavailable or exceeded'; end if;
end;
$$;

revoke all on function public.reserve_twitterapi_sports_usage(text,text,integer) from public,anon,authenticated;
revoke all on function public.settle_twitterapi_sports_usage(bigint,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_twitterapi_sports_usage(text,text,integer) to service_role;
grant execute on function public.settle_twitterapi_sports_usage(bigint,integer,integer) to service_role;
commit;
