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
