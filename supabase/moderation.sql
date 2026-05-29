-- Content moderation: flags, user suspension (run in Supabase SQL Editor)

alter table public.profiles
  add column if not exists suspended_until timestamptz,
  add column if not exists suspension_reason text;

comment on column public.profiles.suspended_until is
  'When set and in the future, user cannot post, comment, or message.';
comment on column public.profiles.suspension_reason is
  'Internal note for admins (not shown to the user).';

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('post', 'comment', 'message')),
  content_id uuid not null,
  subject_user_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  body_excerpt text not null,
  source text not null check (source in ('auto', 'user_report')),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  matched_term text,
  report_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  resolution text check (
    resolution is null
    or resolution in ('dismissed', 'content_deleted', 'user_suspended')
  ),
  created_at timestamptz not null default now(),
  constraint moderation_flags_reporter_check check (
    (source = 'auto' and reporter_id is null)
    or (source = 'user_report' and reporter_id is not null)
  )
);

create index if not exists moderation_flags_pending_created_idx
  on public.moderation_flags (created_at desc)
  where status = 'pending';

create index if not exists moderation_flags_content_idx
  on public.moderation_flags (content_type, content_id);

create unique index if not exists moderation_flags_unique_user_report_idx
  on public.moderation_flags (content_type, content_id, reporter_id)
  where status = 'pending' and source = 'user_report';

create unique index if not exists moderation_flags_unique_auto_idx
  on public.moderation_flags (content_type, content_id)
  where status = 'pending' and source = 'auto';

alter table public.moderation_flags enable row level security;

drop policy if exists "Admins can view moderation flags" on public.moderation_flags;
create policy "Admins can view moderation flags"
  on public.moderation_flags for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update moderation flags" on public.moderation_flags;
create policy "Admins can update moderation flags"
  on public.moderation_flags for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can submit reports" on public.moderation_flags;
create policy "Users can submit reports"
  on public.moderation_flags for insert
  to authenticated
  with check (
    source = 'user_report'
    and reporter_id = auth.uid()
    and reporter_id <> subject_user_id
  );
