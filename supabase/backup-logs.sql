-- Backup & Recovery center (run on DEV + PROD)
-- Tracks every backup run. Actual files live in the "backups" storage bucket.
-- Run after admin.sql (requires public.is_admin).

-- ─── table ───────────────────────────────────────────────────────────────────

create table if not exists public.backup_logs (
  id            uuid        primary key default gen_random_uuid(),

  -- 'snapshot' = full public-schema dump (scheduled or manual)
  -- 'full' / 'incremental' = legacy labels kept for old rows
  backup_type   text        not null
                check (backup_type in ('snapshot', 'full', 'incremental')),

  -- which Supabase project
  environment   text        not null
                check (environment in ('dev', 'prod')),

  -- workflow lifecycle
  status        text        not null default 'pending'
                check (status in ('pending', 'running', 'completed', 'failed')),

  started_at    timestamptz not null default now(),
  completed_at  timestamptz,

  -- path inside the "backups" bucket, e.g. prod/2026/06/full-20260621T000000Z.sql.gz
  file_path     text,
  file_size_bytes bigint,

  -- summary of what was dumped
  tables_dumped int,
  row_counts    jsonb,

  -- who/what started it
  triggered_by  text        not null default 'schedule'
                check (triggered_by in ('schedule', 'manual')),
  triggered_by_user_id uuid references public.profiles (id) on delete set null,

  -- if something went wrong
  error_message text,

  -- GitHub Actions run URL for traceability
  github_run_url text,

  created_at    timestamptz not null default now()
);

create index if not exists backup_logs_env_started_idx
  on public.backup_logs (environment, started_at desc);

create index if not exists backup_logs_status_idx
  on public.backup_logs (status, started_at desc);

alter table public.backup_logs enable row level security;

-- Only admins can see backup logs
drop policy if exists "Admins can read backup logs" on public.backup_logs;
create policy "Admins can read backup logs"
  on public.backup_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- Admins can insert manual backup requests from the UI
drop policy if exists "Admins can insert backup logs" on public.backup_logs;
create policy "Admins can insert backup logs"
  on public.backup_logs for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- service_role (GitHub Actions) bypasses RLS for update — no policy needed.

grant select, insert on public.backup_logs to authenticated;

-- ─── storage bucket ──────────────────────────────────────────────────────────

-- Private bucket: nobody can read files without a signed URL (admin only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backups',
  'backups',
  false,
  524288000,  -- 500 MB per file
  array[
    'application/gzip',
    'application/x-gzip',
    'application/octet-stream',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public           = excluded.public,
  file_size_limit  = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Only admins can read (download signed URLs) from the backups bucket.
drop policy if exists "Admins can read backup files" on storage.objects;
create policy "Admins can read backup files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'backups'
    and public.is_admin(auth.uid())
  );

-- No authenticated INSERT/UPDATE/DELETE — only service_role (GitHub Actions) can upload.
-- service_role bypasses RLS entirely.
