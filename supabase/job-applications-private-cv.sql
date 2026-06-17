-- Restrict job-application CV access (run on DEV + PROD)
-- Make the bucket private and scope reads to the applicant + the job author.
-- Run after job-applications.sql (and job-applications-cv.sql).
--
-- Path convention (set in app/actions/jobs.ts):
--   <job_id>/<applicant_uid>/<timestamp>-<filename>
--   split_part(name, '/', 1) = job_id
--   split_part(name, '/', 2) = applicant user id

-- 1. Make the bucket private. CVs are no longer served via public URLs;
--    the app issues short-lived signed URLs to authorized users instead.
update storage.buckets
set public = false
where id = 'job-applications';

-- 2. Replace the permissive SELECT policy with applicant-OR-job-author scoping.
drop policy if exists "Applicants can read CV files" on storage.objects;
drop policy if exists "Applicants and job authors can read CV files" on storage.objects;
create policy "Applicants and job authors can read CV files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-applications'
    and (
      split_part(name, '/', 2) = auth.uid()::text
      or exists (
        select 1
        from public.jobs j
        where j.id::text = split_part(name, '/', 1)
          and j.author_id = auth.uid()
      )
    )
  );

-- 3. Keep INSERT scoped to the applicant (re-assert idempotently).
drop policy if exists "Applicants can upload CV files" on storage.objects;
create policy "Applicants can upload CV files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-applications'
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- 4. UPDATE / DELETE: intentionally left with no policy, so they remain denied
--    by default for the authenticated role. The app never updates or deletes CVs.
