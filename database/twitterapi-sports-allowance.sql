-- One-off user-authorized completion allowance. Ledger history is unchanged.
-- Base limits remain11300/day and339000/30days. This row expires for daily
-- spending after2026-10-21; it leaves the monthly window after30UTCdays.
begin;
create table if not exists public.twitterapi_sports_allowances (
  day date primary key,
  extra_credits integer not null check (extra_credits between 1 and 1000000),
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.twitterapi_sports_allowances enable row level security;
revoke all on public.twitterapi_sports_allowances from public,anon,authenticated,service_role;
grant select on public.twitterapi_sports_allowances to service_role;
-- The worker can read this allowance but cannot create/increase another one.
insert into public.twitterapi_sports_allowances(day,extra_credits,reason)
  values(date '2026-10-21',100000,'User authorized completing ten Arabic sports posts today; initial one-off additional allowance of $1.')
  on conflict(day) do nothing;

create or replace function public.get_twitterapi_sports_budget()
returns jsonb language plpgsql security invoker
set search_path = pg_catalog, public as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_midnight timestamptz := date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  v_daily bigint; v_monthly bigint; v_daily_extra bigint; v_monthly_extra bigint;
begin
  select coalesce(sum(extra_credits) filter(where day=v_day),0),coalesce(sum(extra_credits),0)
    into v_daily_extra,v_monthly_extra from public.twitterapi_sports_allowances
    where day between v_day-29 and v_day;
  select coalesce(sum(credits) filter(where ran_at>=v_midnight),0),coalesce(sum(credits),0)
    into v_daily,v_monthly from public.twitterapi_sports_usage
    where ran_at>=v_midnight-interval '29 days';
  return jsonb_build_object('day',v_day,'dailyCredits',11300+v_daily_extra,
    'rolling30Credits',339000+v_monthly_extra,'dailyExtraCredits',v_daily_extra,
    'rolling30ExtraCredits',v_monthly_extra,'dailyUsedCredits',v_daily,
    'rolling30UsedCredits',v_monthly,
    'remainingCredits',greatest(0,least(11300+v_daily_extra-v_daily,339000+v_monthly_extra-v_monthly)));
end;
$$;

create or replace function public.reserve_twitterapi_sports_usage(
  p_endpoint text, p_request_hash text, p_credits integer
) returns bigint language plpgsql security invoker set search_path=pg_catalog,public as $$
declare
  v_budget jsonb; v_id bigint;
begin
  if p_credits is null or p_credits<1 or p_credits>11300 then raise exception 'Invalid credit reservation'; end if;
  perform pg_advisory_xact_lock(4170992,11300);
  v_budget := public.get_twitterapi_sports_budget();
  if p_credits>(v_budget->>'remainingCredits')::bigint then raise exception 'TWITTERAPI_BUDGET_EXHAUSTED'; end if;
  insert into public.twitterapi_sports_usage(endpoint,request_hash,reserved_credits,credits)
    values(p_endpoint,p_request_hash,p_credits,p_credits) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.get_twitterapi_sports_budget() from public,anon,authenticated;
revoke all on function public.reserve_twitterapi_sports_usage(text,text,integer) from public,anon,authenticated;
grant execute on function public.get_twitterapi_sports_budget() to service_role;
grant execute on function public.reserve_twitterapi_sports_usage(text,text,integer) to service_role;
commit;
