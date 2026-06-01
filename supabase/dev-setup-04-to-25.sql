-- NurseLinks dev setup: migrations 04-25 in one run
-- Prerequisite: run 01 schema.sql, 02 storage.sql, 03 post-images.sql first.
-- Paste this entire file into Supabase SQL Editor (dev project) and click Run once.


-- ========================================================================
-- 04. feed-social.sql
-- ========================================================================

-- Social layer for posts (run in Supabase SQL Editor after schema.sql)

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_id_idx on public.post_likes (post_id);
create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_body_len check (char_length(body) <= 2000)
);

create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, created_at desc);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "Post likes are readable by everyone"
  on public.post_likes for select
  using (true);

create policy "Users can like as themselves"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike their own like"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Post comments are readable by everyone"
  on public.post_comments for select
  using (true);

create policy "Users can comment as themselves"
  on public.post_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Post authors can delete comments on their posts"
  on public.post_comments for delete
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.author_id = auth.uid()
    )
  );

-- Aggregate counts for feed (one round-trip)
create or replace function public.feed_post_stats(post_ids uuid[])
returns table (post_id uuid, like_count bigint, comment_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select pid as post_id,
    (select count(*)::bigint from post_likes l where l.post_id = pid),
    (select count(*)::bigint from post_comments c where c.post_id = pid)
  from unnest(post_ids) as u(pid);
$$;

grant execute on function public.feed_post_stats(uuid[]) to anon, authenticated;


-- ========================================================================
-- 06. post-comment-likes.sql
-- ========================================================================

-- Comment likes + authors can delete their own comments (run in Supabase SQL Editor)

create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists post_comment_likes_comment_id_idx
  on public.post_comment_likes (comment_id);

create index if not exists post_comment_likes_user_id_idx
  on public.post_comment_likes (user_id);

alter table public.post_comment_likes enable row level security;

create policy "Comment likes are readable by everyone"
  on public.post_comment_likes for select
  using (true);

create policy "Users can like comments as themselves"
  on public.post_comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike their own comment like"
  on public.post_comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Allow comment authors to remove their own comments (post authors already can via feed-social.sql)
drop policy if exists "Comment authors can delete their own comments" on public.post_comments;

create policy "Comment authors can delete their own comments"
  on public.post_comments for delete
  to authenticated
  using (auth.uid() = author_id);


-- ========================================================================
-- 07. post-comment-replies.sql
-- ========================================================================

-- Nested replies on post comments (run in Supabase SQL Editor after feed-social.sql)

alter table public.post_comments
  add column if not exists parent_comment_id uuid references public.post_comments (id) on delete cascade;

create index if not exists post_comments_parent_id_idx
  on public.post_comments (parent_comment_id)
  where parent_comment_id is not null;

create or replace function public.post_comments_validate_parent()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.post_comments parent
    where parent.id = new.parent_comment_id
      and parent.post_id = new.post_id
  ) then
    raise exception 'parent_comment_wrong_post';
  end if;

  -- One nesting level: replies attach only to top-level comments.
  if exists (
    select 1
    from public.post_comments parent
    where parent.id = new.parent_comment_id
      and parent.parent_comment_id is not null
  ) then
    raise exception 'nested_reply_too_deep';
  end if;

  return new;
end;
$$;

drop trigger if exists post_comments_validate_parent on public.post_comments;

create trigger post_comments_validate_parent
  before insert on public.post_comments
  for each row
  execute function public.post_comments_validate_parent();


-- ========================================================================
-- 08. post-shares.sql
-- ========================================================================

-- Post shares (send link to a connection via messages). Run after feed-social.sql

create table if not exists public.post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  sharer_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_shares_unique_per_recipient unique (post_id, sharer_id, recipient_id)
);

create index if not exists post_shares_post_id_idx on public.post_shares (post_id);

alter table public.post_shares enable row level security;

create policy "Post shares are readable by everyone"
  on public.post_shares for select
  using (true);

create policy "Users can share as themselves"
  on public.post_shares for insert
  to authenticated
  with check (auth.uid() = sharer_id);

-- Extend feed stats RPC (adds share_count; must drop old return type first)
drop function if exists public.feed_post_stats(uuid[]);

create function public.feed_post_stats(post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  comment_count bigint,
  share_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select pid as post_id,
    (select count(*)::bigint from post_likes l where l.post_id = pid),
    (select count(*)::bigint from post_comments c where c.post_id = pid),
    (select count(*)::bigint from post_shares s where s.post_id = pid)
  from unnest(post_ids) as u(pid);
$$;

grant execute on function public.feed_post_stats(uuid[]) to anon, authenticated;


-- ========================================================================
-- 09. jobs.sql
-- ========================================================================

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


-- ========================================================================
-- 10. job-applications.sql
-- ========================================================================

-- Job applications (run after jobs.sql)

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint job_applications_name_len check (char_length(full_name) between 2 and 120),
  constraint job_applications_phone_len check (char_length(phone) between 9 and 20),
  constraint job_applications_note_len check (note is null or char_length(note) <= 500),
  constraint job_applications_unique_applicant unique (job_id, applicant_id)
);

create index if not exists job_applications_job_id_idx
  on public.job_applications (job_id, created_at desc);

alter table public.job_applications enable row level security;

create policy "Applicants and job authors can read applications"
  on public.job_applications for select
  to authenticated
  using (
    auth.uid() = applicant_id
    or exists (
      select 1
      from public.jobs j
      where j.id = job_id and j.author_id = auth.uid()
    )
  );

create policy "Users can apply to active jobs they do not own"
  on public.job_applications for insert
  to authenticated
  with check (
    auth.uid() = applicant_id
    and exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and j.status = 'active'
        and j.author_id <> auth.uid()
    )
  );

grant select, insert on public.job_applications to authenticated;

-- Optional CV uploads for job applications
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-applications',
  'job-applications',
  true,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Applicants can upload CV files" on storage.objects;
create policy "Applicants can upload CV files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-applications'
    and split_part(name, '/', 2) = auth.uid()::text
  );

drop policy if exists "Applicants can read CV files" on storage.objects;
create policy "Applicants can read CV files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'job-applications');


-- ========================================================================
-- 11. jobs-scaling.sql
-- ========================================================================

-- Jobs: indexes & filter column for search at scale (run after jobs.sql)

create extension if not exists pg_trgm;

alter table public.jobs
  add column if not exists institution_slug text;

comment on column public.jobs.institution_slug is
  'Medical institution slug for indexed filters (see lib/data/medical-institutions.ts).';

-- Active feed: newest first (partial index keeps index small)
create index if not exists jobs_active_created_idx
  on public.jobs (created_at desc)
  where status = 'active';

-- Poster dashboard: my jobs by status
create index if not exists jobs_author_status_created_idx
  on public.jobs (author_id, status, created_at desc);

-- Filter by workplace
create index if not exists jobs_institution_active_idx
  on public.jobs (institution_slug, created_at desc)
  where status = 'active' and institution_slug is not null;

-- Filter by city
create index if not exists jobs_city_active_idx
  on public.jobs (city, created_at desc)
  where status = 'active' and city is not null;

-- Text search (pg_trgm); use with similarity or ILIKE on indexed columns
create index if not exists jobs_title_trgm_idx
  on public.jobs using gin (title gin_trgm_ops);

create index if not exists jobs_body_trgm_idx
  on public.jobs using gin (body gin_trgm_ops);

-- Applications: count per job for poster (already has job_id index)
create index if not exists job_applications_job_created_idx
  on public.job_applications (job_id, created_at desc);


-- ========================================================================
-- 12. job-applications-seen.sql
-- ========================================================================

-- Track when job owners last viewed applications (run after job-applications.sql)

alter table public.job_list_views
  add column if not exists applications_seen_at timestamptz not null default '1970-01-01'::timestamptz;

comment on column public.job_list_views.applications_seen_at is
  'Last time user opened jobs — clears nav dot for new applications on their postings.';


-- ========================================================================
-- 13. job-applications-read.sql
-- ========================================================================

-- Per-application read state for job owners (run after job-applications.sql)

alter table public.job_applications
  add column if not exists owner_read_at timestamptz;

create index if not exists job_applications_unread_owner_idx
  on public.job_applications (job_id)
  where owner_read_at is null;

drop policy if exists "Job authors can mark applications read" on public.job_applications;

create policy "Job authors can mark applications read"
  on public.job_applications for update
  to authenticated
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = job_id and j.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = job_id and j.author_id = auth.uid()
    )
  );

grant update on public.job_applications to authenticated;


-- ========================================================================
-- 14. job-applications-cv.sql
-- ========================================================================

-- Dedicated CV fields on job applications (run after job-applications.sql)

alter table public.job_applications
  add column if not exists cv_url text,
  add column if not exists cv_file_name text;

alter table public.job_applications
  drop constraint if exists job_applications_cv_url_len;

alter table public.job_applications
  add constraint job_applications_cv_url_len
  check (cv_url is null or char_length(cv_url) <= 2000);

alter table public.job_applications
  drop constraint if exists job_applications_cv_file_name_len;

alter table public.job_applications
  add constraint job_applications_cv_file_name_len
  check (cv_file_name is null or char_length(cv_file_name) <= 255);


-- ========================================================================
-- 15. profile-workplace.sql
-- ========================================================================

-- Profile medical workplace (run after schema.sql)

alter table public.profiles
  add column if not exists workplace_institution_slug text;

comment on column public.profiles.workplace_institution_slug is
  'Slug from lib/data/medical-institutions.ts, or "other".';


-- ========================================================================
-- 16. medical-institutions.sql
-- ========================================================================

-- Optional: seed workplaces for future user ↔ institution links (run after schema.sql)

alter table public.workplaces
  add column if not exists slug text unique,
  add column if not exists region text,
  add column if not exists short_label text,
  add column if not exists full_name text,
  add column if not exists address text;

-- Institutions are defined in lib/data/medical-institutions.ts for the UI.
-- When you add profile workplace selection, link profiles via user_workplaces.


-- ========================================================================
-- 17. connections-messaging.sql
-- ========================================================================

-- Connections polish + direct messages (run after schema.sql)

create extension if not exists pg_trgm;

-- Allow cancel/reject on pending requests
drop policy if exists "Users can delete pending connections they are part of" on public.connections;
create policy "Users can delete pending connections they are part of"
  on public.connections for delete
  to authenticated
  using (
    status = 'pending'
    and auth.uid() in (requester_id, addressee_id)
  );

-- Shared helper: are two users connected?
create or replace function public.users_are_connected(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = user_a and c.addressee_id = user_b)
        or (c.requester_id = user_b and c.addressee_id = user_a)
      )
  );
$$;

grant execute on function public.users_are_connected(uuid, uuid) to authenticated;

-- Direct messages between connected users only
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint direct_messages_no_self check (sender_id <> recipient_id),
  constraint direct_messages_body_len check (char_length(body) <= 4000)
);

create index if not exists direct_messages_recipient_created_idx
  on public.direct_messages (recipient_id, created_at desc);

create index if not exists direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at desc);

create index if not exists direct_messages_pair_created_idx
  on public.direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

alter table public.direct_messages enable row level security;

drop policy if exists "Users read their own messages" on public.direct_messages;
create policy "Users read their own messages"
  on public.direct_messages for select
  to authenticated
  using (auth.uid() in (sender_id, recipient_id));

drop policy if exists "Connected users can send messages" on public.direct_messages;
create policy "Connected users can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = recipient_id)
          or (c.requester_id = recipient_id and c.addressee_id = auth.uid())
        )
    )
  );

grant select, insert, update on public.direct_messages to authenticated;

drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read"
  on public.direct_messages for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Faster name search (Hebrew + English names in full_name)
create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

-- Requires: create extension if not exists pg_trgm; (run once per database)
-- If pg_trgm is unavailable, skip the index above and rely on ilike.


-- ========================================================================
-- 18. messages-open-send.sql
-- ========================================================================

-- Allow any authenticated user to send a direct message (not only connected friends).
-- Run in Supabase SQL Editor if messages fail with RLS / "לא ניתן לשלוח את ההודעה".

drop policy if exists "Connected users can send messages" on public.direct_messages;

create policy "Authenticated users can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and sender_id <> recipient_id
  );

grant insert on public.direct_messages to authenticated;


-- ========================================================================
-- 19. connection-remove-friend.sql
-- ========================================================================

-- Allow either party to remove an accepted connection (unfriend).
-- Run in Supabase SQL Editor if removing friends returns a permission error.
-- Safe to run after connections-messaging.sql or account-deletion-and-recommendations.sql.

drop policy if exists "Users can delete pending connections they are part of" on public.connections;
drop policy if exists "Users can delete connections they are part of" on public.connections;

create policy "Users can delete connections they are part of"
  on public.connections for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));


-- ========================================================================
-- 20. profile-cv.sql
-- ========================================================================

-- Store CV on profile so other users can view it (run in Supabase SQL Editor)

alter table public.profiles
  add column if not exists cv_draft jsonb;

-- Read CV saved in auth metadata (legacy) for profile pages — authenticated users only
create or replace function public.get_profile_cv_draft(target_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.cv_draft from public.profiles p where p.id = target_id),
    (select u.raw_user_meta_data -> 'cv_draft' from auth.users u where u.id = target_id)
  );
$$;

grant execute on function public.get_profile_cv_draft(uuid) to authenticated;


-- ========================================================================
-- 21. account-deletion-and-recommendations.sql
-- ========================================================================

-- Account deletion support + mutual connection recommendations
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at);

-- One-time cleanup for already deleted profiles. Public feed history stays attached to
-- the anonymized profile; private/profile registration rows are removed.
delete from public.user_specialties us
using public.profiles p
where p.id = us.user_id
  and p.deleted_at is not null;

delete from public.user_workplaces uw
using public.profiles p
where p.id = uw.user_id
  and p.deleted_at is not null;

delete from public.job_list_views jlv
using public.profiles p
where p.id = jlv.user_id
  and p.deleted_at is not null;

delete from public.connections c
using public.profiles p
where p.deleted_at is not null
  and p.id in (c.requester_id, c.addressee_id);

delete from public.follows f
using public.profiles p
where p.deleted_at is not null
  and p.id in (f.follower_id, f.following_id);

delete from public.post_shares ps
using public.profiles p
where p.deleted_at is not null
  and p.id in (ps.sharer_id, ps.recipient_id);

delete from public.direct_messages dm
using public.profiles p
where p.deleted_at is not null
  and p.id in (dm.sender_id, dm.recipient_id);

delete from public.job_applications ja
using public.profiles p
where p.id = ja.applicant_id
  and p.deleted_at is not null;

-- One-time repair: free email addresses for profiles that were already marked deleted
-- before the app started anonymizing Supabase Auth emails.
with deleted_auth as (
  select
    u.id,
    u.email as old_email,
    'deleted+' || replace(u.id::text, '-', '') || '@nurselinks.invalid' as new_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.deleted_at is not null
    and u.email !~ '^deleted\+.*@nurselinks\.invalid$'
),
updated_users as (
  update auth.users u
  set
    email = da.new_email,
    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('full_name', 'משתמש שנמחק', 'deleted_at', now()::text),
    updated_at = now()
  from deleted_auth da
  where u.id = da.id
  returning u.id, da.old_email, da.new_email
)
update auth.identities i
set
  provider_id = case
    when i.provider = 'email' and i.provider_id = u.old_email then u.new_email
    else i.provider_id
  end,
  identity_data = coalesce(i.identity_data, '{}'::jsonb)
    || jsonb_build_object('email', u.new_email),
  updated_at = now()
from updated_users u
where i.user_id = u.id;

-- Deleting an account removes social graph rows while preserving historical content.
drop policy if exists "Users can delete connections they are part of" on public.connections;
create policy "Users can delete connections they are part of"
  on public.connections for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Users can delete follows they are part of" on public.follows;
create policy "Users can delete follows they are part of"
  on public.follows for delete
  to authenticated
  using (auth.uid() in (follower_id, following_id));

drop function if exists public.connection_recommendations(int);

create function public.connection_recommendations(limit_count int default 10)
returns table (profile_id uuid, mutual_count bigint, mutual_ids uuid[])
language sql
stable
security definer
set search_path = public
as $$
  with my_connections as (
    select
      case
        when c.requester_id = auth.uid() then c.addressee_id
        else c.requester_id
      end as friend_id
    from public.connections c
    where c.status = 'accepted'
      and auth.uid() in (c.requester_id, c.addressee_id)
  ),
  existing_connections as (
    select
      case
        when c.requester_id = auth.uid() then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where auth.uid() in (c.requester_id, c.addressee_id)
  ),
  second_degree as (
    select distinct
      case
        when c.requester_id = mc.friend_id then c.addressee_id
        else c.requester_id
      end as candidate_id,
      mc.friend_id
    from my_connections mc
    join public.connections c
      on c.status = 'accepted'
      and mc.friend_id in (c.requester_id, c.addressee_id)
  )
  select
    sd.candidate_id as profile_id,
    count(distinct sd.friend_id)::bigint as mutual_count,
    array_agg(distinct sd.friend_id order by sd.friend_id) as mutual_ids
  from second_degree sd
  join public.profiles p on p.id = sd.candidate_id
  where sd.candidate_id <> auth.uid()
    and p.deleted_at is null
    and not exists (
      select 1 from my_connections mc where mc.friend_id = sd.candidate_id
    )
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = sd.candidate_id
    )
  group by sd.candidate_id
  order by count(distinct sd.friend_id) desc, max(p.created_at) desc
  limit greatest(0, limit_count);
$$;

grant execute on function public.connection_recommendations(int) to authenticated;


-- ========================================================================
-- 22. recommendation-snapshots.sql
-- ========================================================================

-- Scheduled snapshots for connection recommendations (mutual + same workplace)
-- Run in Supabase SQL Editor. For upgrades on existing DBs also run recommendation-workplace.sql.

create table if not exists public.connection_recommendation_snapshots (
  user_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  mutual_count bigint not null default 0,
  mutual_ids uuid[] not null default '{}',
  source text not null default 'mutual' check (source in ('mutual', 'workplace', 'both')),
  institution_slug text,
  rank integer not null,
  generated_at timestamptz not null default now(),
  primary key (user_id, candidate_id)
);

alter table public.connection_recommendation_snapshots
  add column if not exists source text not null default 'mutual'
    check (source in ('mutual', 'workplace', 'both')),
  add column if not exists institution_slug text;

create index if not exists connection_recommendation_snapshots_user_rank_idx
  on public.connection_recommendation_snapshots (user_id, rank);

create index if not exists profiles_workplace_slug_active_idx
  on public.profiles (workplace_institution_slug)
  where deleted_at is null and workplace_institution_slug is not null;

alter table public.connection_recommendation_snapshots enable row level security;

drop policy if exists "Users can read their recommendation snapshots" on public.connection_recommendation_snapshots;
create policy "Users can read their recommendation snapshots"
  on public.connection_recommendation_snapshots for select
  to authenticated
  using (auth.uid() = user_id);

drop function if exists public.connection_recommendations_for_user(uuid, int);
create function public.connection_recommendations_for_user(target_user_id uuid, limit_count int default 10)
returns table (profile_id uuid, mutual_count bigint, mutual_ids uuid[])
language sql
stable
security definer
set search_path = public
as $$
  with my_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as friend_id
    from public.connections c
    where c.status = 'accepted'
      and target_user_id in (c.requester_id, c.addressee_id)
  ),
  existing_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where target_user_id in (c.requester_id, c.addressee_id)
  ),
  second_degree as (
    select distinct
      case
        when c.requester_id = mc.friend_id then c.addressee_id
        else c.requester_id
      end as candidate_id,
      mc.friend_id
    from my_connections mc
    join public.connections c
      on c.status = 'accepted'
      and mc.friend_id in (c.requester_id, c.addressee_id)
  )
  select
    sd.candidate_id as profile_id,
    count(distinct sd.friend_id)::bigint as mutual_count,
    array_agg(distinct sd.friend_id order by sd.friend_id) as mutual_ids
  from second_degree sd
  join public.profiles p on p.id = sd.candidate_id
  where sd.candidate_id <> target_user_id
    and p.deleted_at is null
    and not exists (
      select 1 from my_connections mc where mc.friend_id = sd.candidate_id
    )
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = sd.candidate_id
    )
  group by sd.candidate_id
  order by count(distinct sd.friend_id) desc, max(p.created_at) desc
  limit greatest(0, limit_count);
$$;

drop function if exists public.workplace_colleague_recommendations_for_user(uuid, int);
create function public.workplace_colleague_recommendations_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (profile_id uuid, institution_slug text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select workplace_institution_slug as slug
    from public.profiles
    where id = target_user_id
      and deleted_at is null
      and workplace_institution_slug is not null
  ),
  existing_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where target_user_id in (c.requester_id, c.addressee_id)
  )
  select
    p.id as profile_id,
    p.workplace_institution_slug as institution_slug
  from me
  join public.profiles p
    on p.workplace_institution_slug = me.slug
  where p.id <> target_user_id
    and p.deleted_at is null
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = p.id
    )
  order by p.created_at desc
  limit greatest(0, limit_count);
$$;

drop function if exists public.connection_recommendations_merged_for_user(uuid, int);
create function public.connection_recommendations_merged_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  with workplace as (
    select
      w.profile_id,
      0::bigint as mutual_count,
      '{}'::uuid[] as mutual_ids,
      'workplace'::text as source,
      w.institution_slug
    from public.workplace_colleague_recommendations_for_user(target_user_id, limit_count) w
  ),
  mutual as (
    select
      m.profile_id,
      m.mutual_count,
      m.mutual_ids,
      'mutual'::text as source,
      null::text as institution_slug
    from public.connection_recommendations_for_user(target_user_id, limit_count) m
  ),
  merged as (
    select * from workplace
    union all
    select * from mutual
  ),
  deduped as (
    select
      profile_id,
      max(mutual_count) as mutual_count,
      (
        select m.mutual_ids
        from merged m
        where m.profile_id = merged.profile_id
        order by m.mutual_count desc
        limit 1
      ) as mutual_ids,
      case
        when bool_or(source = 'workplace') and bool_or(source = 'mutual') then 'both'
        when bool_or(source = 'workplace') then 'workplace'
        else 'mutual'
      end as source,
      max(institution_slug) filter (where institution_slug is not null) as institution_slug
    from merged
    group by profile_id
  )
  select
    profile_id,
    mutual_count,
    coalesce(mutual_ids, '{}'::uuid[]) as mutual_ids,
    source,
    institution_slug
  from deduped
  order by
    case source
      when 'both' then 0
      when 'workplace' then 1
      else 2
    end,
    mutual_count desc,
    profile_id
  limit greatest(0, limit_count);
$$;

drop function if exists public.connection_recommendations(int);
create function public.connection_recommendations(limit_count int default 10)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.connection_recommendations_merged_for_user(auth.uid(), limit_count);
$$;

drop function if exists public.refresh_connection_recommendation_snapshots(int);
create function public.refresh_connection_recommendation_snapshots(limit_count int default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer := 0;
begin
  delete from public.connection_recommendation_snapshots;

  insert into public.connection_recommendation_snapshots (
    user_id,
    candidate_id,
    mutual_count,
    mutual_ids,
    source,
    institution_slug,
    rank,
    generated_at
  )
  select
    p.id as user_id,
    r.profile_id as candidate_id,
    r.mutual_count,
    r.mutual_ids,
    r.source,
    r.institution_slug,
    row_number() over (
      partition by p.id
      order by
        case r.source
          when 'both' then 0
          when 'workplace' then 1
          else 2
        end,
        r.mutual_count desc,
        r.profile_id
    ) as rank,
    now()
  from public.profiles p
  cross join lateral public.connection_recommendations_merged_for_user(p.id, limit_count) r
  where p.deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

grant execute on function public.connection_recommendations_for_user(uuid, int) to authenticated;
grant execute on function public.workplace_colleague_recommendations_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations_merged_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations(int) to authenticated;
grant execute on function public.refresh_connection_recommendation_snapshots(int) to service_role;


-- ========================================================================
-- 23. recommendation-workplace.sql
-- ========================================================================

-- Workplace + mutual connection recommendations (run after recommendation-snapshots.sql)

create index if not exists profiles_workplace_slug_active_idx
  on public.profiles (workplace_institution_slug)
  where deleted_at is null and workplace_institution_slug is not null;

alter table public.connection_recommendation_snapshots
  add column if not exists source text not null default 'mutual'
    check (source in ('mutual', 'workplace', 'both')),
  add column if not exists institution_slug text;

-- Colleagues at the same medical institution (indexed column only).
drop function if exists public.workplace_colleague_recommendations_for_user(uuid, int);
create function public.workplace_colleague_recommendations_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (profile_id uuid, institution_slug text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select workplace_institution_slug as slug
    from public.profiles
    where id = target_user_id
      and deleted_at is null
      and workplace_institution_slug is not null
  ),
  existing_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where target_user_id in (c.requester_id, c.addressee_id)
  )
  select
    p.id as profile_id,
    p.workplace_institution_slug as institution_slug
  from me
  join public.profiles p
    on p.workplace_institution_slug = me.slug
  where p.id <> target_user_id
    and p.deleted_at is null
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = p.id
    )
  order by p.created_at desc
  limit greatest(0, limit_count);
$$;

-- Mutual + workplace merged; workplace colleagues ranked before mutual-only.
drop function if exists public.connection_recommendations_merged_for_user(uuid, int);
create function public.connection_recommendations_merged_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  with workplace as (
    select
      w.profile_id,
      0::bigint as mutual_count,
      '{}'::uuid[] as mutual_ids,
      'workplace'::text as source,
      w.institution_slug
    from public.workplace_colleague_recommendations_for_user(target_user_id, limit_count) w
  ),
  mutual as (
    select
      m.profile_id,
      m.mutual_count,
      m.mutual_ids,
      'mutual'::text as source,
      null::text as institution_slug
    from public.connection_recommendations_for_user(target_user_id, limit_count) m
  ),
  merged as (
    select * from workplace
    union all
    select * from mutual
  ),
  deduped as (
    select
      profile_id,
      max(mutual_count) as mutual_count,
      (
        select m.mutual_ids
        from merged m
        where m.profile_id = merged.profile_id
        order by m.mutual_count desc
        limit 1
      ) as mutual_ids,
      case
        when bool_or(source = 'workplace') and bool_or(source = 'mutual') then 'both'
        when bool_or(source = 'workplace') then 'workplace'
        else 'mutual'
      end as source,
      max(institution_slug) filter (where institution_slug is not null) as institution_slug
    from merged
    group by profile_id
  )
  select
    profile_id,
    mutual_count,
    coalesce(mutual_ids, '{}'::uuid[]) as mutual_ids,
    source,
    institution_slug
  from deduped
  order by
    case source
      when 'both' then 0
      when 'workplace' then 1
      else 2
    end,
    mutual_count desc,
    profile_id
  limit greatest(0, limit_count);
$$;

drop function if exists public.connection_recommendations(int);
create function public.connection_recommendations(limit_count int default 10)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.connection_recommendations_merged_for_user(auth.uid(), limit_count);
$$;

drop function if exists public.refresh_connection_recommendation_snapshots(int);
create function public.refresh_connection_recommendation_snapshots(limit_count int default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer := 0;
begin
  delete from public.connection_recommendation_snapshots;

  insert into public.connection_recommendation_snapshots (
    user_id,
    candidate_id,
    mutual_count,
    mutual_ids,
    source,
    institution_slug,
    rank,
    generated_at
  )
  select
    p.id as user_id,
    r.profile_id as candidate_id,
    r.mutual_count,
    r.mutual_ids,
    r.source,
    r.institution_slug,
    row_number() over (
      partition by p.id
      order by
        case r.source
          when 'both' then 0
          when 'workplace' then 1
          else 2
        end,
        r.mutual_count desc,
        r.profile_id
    ) as rank,
    now()
  from public.profiles p
  cross join lateral public.connection_recommendations_merged_for_user(p.id, limit_count) r
  where p.deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

grant execute on function public.workplace_colleague_recommendations_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations_merged_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations(int) to authenticated;


-- ========================================================================
-- 24. admin.sql
-- ========================================================================

-- Admin console support.
-- Run in Supabase SQL Editor, then add your own user as admin:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL_HERE';

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


-- ========================================================================
-- 25. moderation.sql
-- ========================================================================

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

-- Done. Optional: add yourself as admin:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL';
