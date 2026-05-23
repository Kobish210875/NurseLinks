-- Track when job owners last viewed applications (run after job-applications.sql)

alter table public.job_list_views
  add column if not exists applications_seen_at timestamptz not null default '1970-01-01'::timestamptz;

comment on column public.job_list_views.applications_seen_at is
  'Last time user opened jobs — clears nav dot for new applications on their postings.';
