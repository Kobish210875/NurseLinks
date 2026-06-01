-- Users can dismiss a connection recommendation; dismissed candidates are excluded until cleared.
-- Run in Supabase SQL Editor after recommendation-snapshots.sql.

create table if not exists public.connection_recommendation_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  dismissed_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dismissed_user_id),
  check (user_id <> dismissed_user_id)
);

create index if not exists connection_recommendation_dismissals_user_idx
  on public.connection_recommendation_dismissals (user_id);

alter table public.connection_recommendation_dismissals enable row level security;

drop policy if exists "Users read own recommendation dismissals" on public.connection_recommendation_dismissals;
create policy "Users read own recommendation dismissals"
  on public.connection_recommendation_dismissals for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own recommendation dismissals" on public.connection_recommendation_dismissals;
create policy "Users insert own recommendation dismissals"
  on public.connection_recommendation_dismissals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own recommendation dismissals" on public.connection_recommendation_dismissals;
create policy "Users delete own recommendation dismissals"
  on public.connection_recommendation_dismissals for delete
  using (auth.uid() = user_id);
