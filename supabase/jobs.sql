-- Job postings (run in Supabase SQL Editor after schema.sql)

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  hospital text,
  city text,
  institution_slug text,
  status text not null default 'active' check (status in ('active', 'filled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  filled_at timestamptz,
  constraint jobs_title_len check (char_length(title) <= 200),
  constraint jobs_body_len check (char_length(body) <= 4000)
);

create index if not exists jobs_status_created_idx
  on public.jobs (status, created_at desc);

create index if not exists jobs_author_id_idx on public.jobs (author_id);

-- When each user last opened the jobs page (for unread badge)
create table if not exists public.job_list_views (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  seen_at timestamptz not null default '1970-01-01'::timestamptz
);

alter table public.jobs enable row level security;
alter table public.job_list_views enable row level security;

create policy "Jobs are readable by everyone"
  on public.jobs for select
  using (true);

create policy "Users can publish jobs"
  on public.jobs for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their jobs"
  on public.jobs for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete their jobs"
  on public.jobs for delete
  to authenticated
  using (auth.uid() = author_id);

create policy "Users can read their jobs seen timestamp"
  on public.job_list_views for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their jobs seen timestamp"
  on public.job_list_views for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can upsert their jobs seen timestamp"
  on public.job_list_views for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update on public.job_list_views to authenticated;
