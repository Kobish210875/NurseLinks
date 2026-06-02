SET session_replication_role = replica;

TRUNCATE auth.refresh_tokens CASCADE;
TRUNCATE auth.sessions CASCADE;
TRUNCATE auth.identities CASCADE;
TRUNCATE auth.users CASCADE;

TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.specialties, public.workplaces CASCADE;

ALTER TABLE public.direct_messages  DROP CONSTRAINT IF EXISTS direct_messages_body_len;
ALTER TABLE public.jobs             DROP CONSTRAINT IF EXISTS jobs_body_len;
ALTER TABLE public.jobs             DROP CONSTRAINT IF EXISTS jobs_title_len;
ALTER TABLE public.post_comments    DROP CONSTRAINT IF EXISTS post_comments_body_len;
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_note_len;
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_name_len;
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_phone_len;
