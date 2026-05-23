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
