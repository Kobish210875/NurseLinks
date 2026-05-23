-- Profile medical workplace (run after schema.sql)

alter table public.profiles
  add column if not exists workplace_institution_slug text;

comment on column public.profiles.workplace_institution_slug is
  'Slug from lib/data/medical-institutions.ts, or "other".';
