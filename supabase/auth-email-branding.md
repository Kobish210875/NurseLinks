# Supabase auth emails — NurseLinks branding (localhost / DEV)

Password reset and signup emails are sent by **Supabase Auth**, not by the Next.js app.
The sender name and subject are configured in the Supabase Dashboard for your **DEV** project
(the one in `.env.local`).

## Steps (DEV project only)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **nurselinks-dev** project.
2. Go to **Authentication** → **Email Templates**.
3. For each template below, set **Subject** and edit the body so it says **NurseLinks** (not Supabase).

### Suggested subjects (Hebrew UI)

| Template | Subject |
|--------|---------|
| Confirm signup | `NurseLinks — אימות כתובת אימייל` |
| Reset password | `NurseLinks — איפוס סיסמה` |
| Magic link | `NurseLinks — קישור התחברות` |
| Change email | `NurseLinks — שינוי אימייל` |

### Sender name (if available)

Under **Project Settings** → **Authentication** (or custom SMTP):

- Set the sender / from name to **NurseLinks**.
- On the default Supabase mailer, the visible “from” may still show `noreply@mail.app.supabase.io`;
  custom SMTP (e.g. Resend) is required for a fully branded `from` address on auth emails.

### Localhost redirect URLs

**Authentication** → **URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/reset-password`, `http://localhost:3000/auth/confirm`, `http://localhost:3000/auth/callback`

Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`.

## App notification emails (jobs, comments)

These use **Resend** when `RESEND_API_KEY` and `NOTIFICATIONS_FROM_EMAIL` are set in `.env.local`.
The app sends them as **NurseLinks** automatically (see `lib/notifications/from-email.ts`).
