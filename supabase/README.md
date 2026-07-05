# Supabase setup

1. Create a free Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional (required for job-application emails to posters): `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NOTIFICATIONS_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`
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
   - `supabase/job-applications-cv.sql` (dedicated CV URL + filename on applications; inbox download button)
   - `supabase/profile-workplace.sql` (recommended: dedicated `workplace_institution_slug` column; app falls back to `cv_draft` until run)
   - `supabase/medical-institutions.sql` (optional workplaces table columns)
   - `supabase/connections-messaging.sql` (connection requests + direct messages)
   - `supabase/messages-open-send.sql` (optional: allow messaging users who are not connected friends)
   - `supabase/profile-cv.sql` (CV visible on other users' profile pages)
   - `supabase/recommendation-snapshots.sql` (optional: scheduled friendship recommendation snapshots)
   - `supabase/recommendation-workplace.sql` (upgrade: same-workplace recommendations + index; run if snapshots already exist)
   - `supabase/moderation.sql` (content flags, user suspension, user reports — expand word list in `lib/moderation/wordlist.ts`)
   - `supabase/discussions.sql` (community threads + replies; replaces jobs tab in nav for now)
   - If tables exist but the app still shows setup banner, run `supabase/discussions-grants-fix.sql` (missing GRANT + schema reload).
   - If CV shows empty for others but exists on edit page: `supabase/profile-cv-fix.sql`
   - If message send fails after connecting: `supabase/connections-messaging-fix.sql`
5. Restart the Next.js dev server after changing `.env.local`.

### Scheduled connection recommendations (optional)

To refresh friend recommendations automatically (morning + evening):

1. In Vercel project env vars add `CRON_SECRET` (random long string).
2. Keep `SUPABASE_SERVICE_ROLE_KEY` set (already required for admin operations).
3. Deploy with `vercel.json` cron config (included in repo).
4. In Supabase run `supabase/recommendation-snapshots.sql`.

The cron endpoint is `GET /api/sync/recommendations` and accepts
`Authorization: Bearer $CRON_SECRET`.

See **docs/DEV-AND-PROD.md** for separate dev and production Supabase projects.

### Auth redirect URLs (password reset & email links)

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://nurselinks.net` (or your production domain)
- **Redirect URLs** (add each):
  - `https://nurselinks.net/auth/confirm`
  - `https://nurselinks.net/auth/confirm?**`
  - `https://nurselinks.net/reset-password`
  - `https://nurselinks.net/auth/callback` (legacy signup / old reset emails)

Set `NEXT_PUBLIC_APP_URL=https://nurselinks.net` in production so reset emails use the correct domain.

### Email sender name (NurseLinks, not Supabase)

Auth emails (reset password, confirm signup) use Supabase templates — see **`supabase/auth-email-branding.md`**
for DEV/localhost dashboard steps and suggested Hebrew subjects.

Job/comment notification emails use Resend; set `NOTIFICATIONS_FROM_EMAIL` in `.env.local` (display name `NurseLinks` is added automatically).

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
