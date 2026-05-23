-- Optional: seed workplaces for future user ↔ institution links (run after schema.sql)

alter table public.workplaces
  add column if not exists slug text unique,
  add column if not exists region text,
  add column if not exists short_label text,
  add column if not exists full_name text,
  add column if not exists address text;

-- Institutions are defined in lib/data/medical-institutions.ts for the UI.
-- When you add profile workplace selection, link profiles via user_workplaces.
