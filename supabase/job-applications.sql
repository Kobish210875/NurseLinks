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
