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
