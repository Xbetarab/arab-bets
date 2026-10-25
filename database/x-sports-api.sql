-- Isolated, optional X sports import. Review before applying to production.
-- No rows from X are shown until the server enables the feature and marks
-- individual items visible. This does not modify local posts, profiles,
-- ghost identities, import batches, or administrator permissions.
begin;

create table public.x_sports_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  max_posts_per_run integer not null default 3 check (max_posts_per_run between 1 and 100),
  max_replies_per_post integer not null default 5 check (max_replies_per_post between 0 and 100),
  max_daily_reads integer not null default 60 check (max_daily_reads between 1 and 10000),
  retention_hours integer not null default 48 check (retention_hours between 1 and 168),
  last_run_at timestamptz
);

insert into public.x_sports_settings (id) values (1);

create table public.x_sports_posts (
  x_id text primary key check (x_id ~ '^[0-9]{1,25}$'),
  conversation_id text not null check (conversation_id ~ '^[0-9]{1,25}$'),
  in_reply_to_x_id text check (in_reply_to_x_id ~ '^[0-9]{1,25}$'),
  author_x_id text not null check (author_x_id ~ '^[0-9]{1,25}$'),
  author_username text not null check (author_username ~ '^[A-Za-z0-9_]{1,15}$'),
  author_name text not null check (char_length(author_name) between 1 and 200),
  author_avatar_url text check (author_avatar_url is null or char_length(author_avatar_url) <= 2048),
  body text not null check (char_length(body) between 1 and 30000),
  language text check (language is null or char_length(language) <= 16),
  media_json jsonb not null default '[]'::jsonb check (jsonb_typeof(media_json) = 'array'),
  links_json jsonb not null default '[]'::jsonb check (jsonb_typeof(links_json) = 'array'),
  posted_at timestamptz not null,
  imported_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_visible boolean not null default false,
  deleted_at timestamptz,
  matched_query text check (matched_query is null or char_length(matched_query) <= 500),
  check (expires_at > posted_at),
  check (in_reply_to_x_id is null or in_reply_to_x_id <> x_id)
);

create index x_sports_posts_visible_recent_idx
  on public.x_sports_posts (posted_at desc, x_id desc)
  where is_visible and deleted_at is null;
create index x_sports_posts_conversation_idx
  on public.x_sports_posts (conversation_id, posted_at, x_id);
create index x_sports_posts_expiry_idx
  on public.x_sports_posts (expires_at);

-- The server updates this ledger after API reads. It permits a conservative
-- UTC-day budget check without exposing billing information to visitors.
create table public.x_sports_runs (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  status text not null default 'completed' check (char_length(status) between 1 and 40),
  post_reads integer not null default 0 check (post_reads >= 0),
  api_calls integer not null default 1 check (api_calls >= 1),
  query text check (query is null or char_length(query) <= 500)
);
create index x_sports_runs_ran_idx on public.x_sports_runs (ran_at desc);

alter table public.x_sports_settings enable row level security;
alter table public.x_sports_posts enable row level security;
alter table public.x_sports_runs enable row level security;

-- Some Supabase projects inherit broad public-schema grants. Clear them first.
revoke all on public.x_sports_settings, public.x_sports_posts, public.x_sports_runs
  from public, anon, authenticated;
grant select, insert, update, delete
  on public.x_sports_settings, public.x_sports_posts, public.x_sports_runs
  to service_role;
grant usage, select on sequence public.x_sports_runs_id_seq to service_role;

-- No browser role can query raw imported IDs, author/media origins or links.
-- Server-rendered pages project only approved fields after checking the
-- feature switch and post visibility; service_role alone reads these tables.

commit;
