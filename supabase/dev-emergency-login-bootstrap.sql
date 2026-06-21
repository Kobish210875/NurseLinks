-- Emergency DEV recovery when restore failed and public.profiles is missing.
-- Restores login only (not your app data). After you can log in, run שחזור DB from /admin/backups.
-- Replace YOUR_EMAIL below, then run the whole script in the DEV Supabase SQL Editor.

create extension if not exists "pgcrypto";

create schema if not exists public;
grant all on schema public to postgres;
grant all on schema public to public;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  headline text,
  license_number text,
  city text,
  avatar_url text,
  workplace_institution_slug text,
  cv_draft jsonb,
  deleted_at timestamptz,
  suspended_until timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, headline, city)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'headline', ''),
    nullif(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, headline)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  ),
  nullif(u.raw_user_meta_data ->> 'headline', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.deleted_at is null
on conflict (id) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = target_user_id
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin(auth.uid()));

insert into public.admin_users (user_id)
select id from auth.users where email = 'YOUR_EMAIL_HERE'
on conflict (user_id) do nothing;

-- Backup admin UI (requires is_admin above)
create table if not exists public.backup_logs (
  id            uuid        primary key default gen_random_uuid(),
  backup_type   text        not null
                check (backup_type in ('snapshot', 'full', 'incremental')),
  operation     text        not null default 'backup'
                check (operation in ('backup', 'restore')),
  environment   text        not null
                check (environment in ('dev', 'prod')),
  status        text        not null default 'pending'
                check (status in ('pending', 'running', 'completed', 'failed')),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  file_path     text,
  file_size_bytes bigint,
  tables_dumped int,
  row_counts    jsonb,
  triggered_by  text        not null default 'schedule'
                check (triggered_by in ('schedule', 'manual')),
  triggered_by_user_id uuid references public.profiles (id) on delete set null,
  error_message text,
  github_run_url text,
  created_at    timestamptz not null default now()
);

create index if not exists backup_logs_env_started_idx
  on public.backup_logs (environment, started_at desc);

create index if not exists backup_logs_status_idx
  on public.backup_logs (status, started_at desc);

alter table public.backup_logs enable row level security;

drop policy if exists "Admins can read backup logs" on public.backup_logs;
create policy "Admins can read backup logs"
  on public.backup_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can insert backup logs" on public.backup_logs;
create policy "Admins can insert backup logs"
  on public.backup_logs for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

grant select, insert, update, delete on public.backup_logs to service_role;
grant select, insert on public.backup_logs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backups',
  'backups',
  false,
  524288000,
  array['application/gzip', 'application/x-gzip', 'application/octet-stream', 'text/plain']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can read backup files" on storage.objects;
create policy "Admins can read backup files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'backups'
    and public.is_admin(auth.uid())
  );

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage on all sequences in schema public to authenticated, anon;
