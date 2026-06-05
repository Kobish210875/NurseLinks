# Supabase auth emails — NurseLinks branding

Password reset and signup emails are sent by **Supabase Auth**, not by the Next.js app.
Configure templates in the Supabase Dashboard for **each project** (DEV and PROD).

## 1. Email templates (required for password reset)

**Authentication → Emails → Reset password**

Set **Subject**: `NurseLinks — איפוס סיסמה`

Replace the default `{{ .ConfirmationURL }}` link with a **token_hash** link (works when the user opens the email on a phone or another browser):

```html
<h2>איפוס סיסמה</h2>
<p>לחצו על הקישור כדי לבחור סיסמה חדשה:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">איפוס סיסמה</a></p>
<p>אם לא ביקשתם איפוס, אפשר להתעלם מהמייל.</p>
```

Do **not** use only `{{ .ConfirmationURL }}` — it relies on PKCE cookies and often fails with “link expired” on production.

### Other templates (subjects)

| Template | Subject |
|--------|---------|
| Confirm signup | `NurseLinks — אימות כתובת אימייל` |
| Magic link | `NurseLinks — קישור התחברות` |
| Change email | `NurseLinks — שינוי אימייל` |

## 2. Redirect URLs

**Authentication → URL Configuration**

### Production (`nurselinks.net`)

- **Site URL**: `https://nurselinks.net`
- **Redirect URLs** (add each):
  - `https://nurselinks.net/auth/confirm`
  - `https://nurselinks.net/auth/confirm?**`
  - `https://nurselinks.net/auth/callback`
  - `https://nurselinks.net/auth/callback?**`
  - `https://nurselinks.net/reset-password`

Set `NEXT_PUBLIC_APP_URL=https://nurselinks.net` in Vercel Production.

### DEV / localhost

- **Site URL**: `http://localhost:3000` (dev project) or your Preview URL
- **Redirect URLs**: `http://localhost:3000/auth/confirm`, `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`, plus `https://*.vercel.app/auth/**` for Preview

Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`.

## 3. Custom SMTP (Resend)

See project docs — required to send more than 2 auth emails/hour and for `noreply@nurselinks.net`.

**Authentication → Emails → SMTP Settings**

| Field | Value |
|--------|--------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend API key |
| Sender email | `noreply@nurselinks.net` |
| Sender name | `NurseLinks` |

## App notification emails (jobs, comments)

These use **Resend** from the Next.js app when `RESEND_API_KEY` and `NOTIFICATIONS_FROM_EMAIL` are set.
See `lib/notifications/from-email.ts`.
