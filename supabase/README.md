# Supabase setup

1. Create a free Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional (for comment email notifications): `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
4. Open the Supabase SQL Editor and run, in order:
   - `supabase/schema.sql`
   - `supabase/storage.sql` (profile photos)
   - `supabase/post-images.sql` (compressed JPEG photos on feed posts)
   - `supabase/feed-social.sql` (likes & comments on posts)
   - `supabase/feed-post-delete.sql` (only post authors can delete posts/comments)
   - `supabase/jobs.sql` (job postings, unread badge, filled status)
   - `supabase/jobs-scaling.sql` (recommended: `institution_slug` + indexes for feed/search at scale)
   - `supabase/job-applications.sql` (apply with name & phone; poster sees applicants on their jobs)
   - `supabase/job-applications-seen.sql` (optional legacy column on job_list_views)
   - `supabase/job-applications-read.sql` (per-application read state; mark read on open / mark all)
   - `supabase/profile-workplace.sql` (recommended: dedicated `workplace_institution_slug` column; app falls back to `cv_draft` until run)
   - `supabase/medical-institutions.sql` (optional workplaces table columns)
   - `supabase/connections-messaging.sql` (connection requests + direct messages)
   - `supabase/profile-cv.sql` (CV visible on other users' profile pages)
   - If CV shows empty for others but exists on edit page: `supabase/profile-cv-fix.sql`
   - If message send fails after connecting: `supabase/connections-messaging-fix.sql`
5. Restart the Next.js dev server after changing `.env.local`.

### Post photos on the feed (required for image posts)

If publishing a post with a photo shows **“אחסון תמונות לפוסטים לא הוגדר”**:

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Paste and run the full contents of `supabase/post-images.sql`.
3. Under **Storage**, confirm a public bucket named `post-images` exists.
4. On Vercel, ensure `SUPABASE_SERVICE_ROLE_KEY` is set (optional fallback for uploads).

Re-deploy is not required after SQL; only the database changes.

The initial schema supports:

- user profiles
- specialties
- workplaces
- user-workplace history
- connection requests (pending → accepted)
- direct messages between connected users
- follows
- posts, likes, and comments on the feed
- automatic profile creation when a Supabase Auth user signs up

This gives NurseLinks enough structure for registration, professional profiles,
and future relationship discovery between nurses.
