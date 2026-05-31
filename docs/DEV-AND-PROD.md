# Dev vs Production setup

Use **two separate Supabase projects** so local testing never touches live users.

## 1. Create a dev Supabase project

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New project** (e.g. `nurselinks-dev`).
2. Run the same SQL files as production (see `supabase/README.md`), in order.
3. Copy **Project URL** and **anon key** from Settings → API.

## 2. Local development (`.env.local`)

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-DEV-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
AUTH_REQUIRE_EMAIL_VERIFICATION=false
```

Start the app:

```powershell
npm run dev
```

Open http://localhost:3000 — all data goes to the **dev** database.

## 3. Production (Vercel)

Vercel → Project → **Settings → Environment Variables** (Production only):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://nurselinks.net` |
| `NEXT_PUBLIC_SUPABASE_URL` | production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | production service role |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `true` |

Never put production keys in `.env.local` on your laptop.

## 4. Optional: staging branch (Preview)

1. Create Supabase project `nurselinks-staging` (or reuse dev).
2. Git branch `develop` → push → Vercel creates a **Preview** URL.
3. In Vercel → Environment Variables → **Preview**:

```env
NEXT_PUBLIC_APP_ENV=preview
NEXT_PUBLIC_SUPABASE_URL=...dev or staging...
```

Workflow:

```
feature branch → Preview URL (dev DB)
develop        → Preview URL (staging DB)
main           → nurselinks.net (production DB)
```

## 5. Supabase Auth redirect URLs

Add for **each** Supabase project (dev + prod):

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`
- `https://nurselinks.net/auth/callback`
- `https://nurselinks.net/auth/confirm`

## 6. Verify which environment is active

In the browser console on any page:

```js
// NEXT_PUBLIC_APP_ENV is embedded at build time
document.querySelector('html')?.getAttribute('data-app-env')
```

Or check `.env.local` / Vercel env vars for `NEXT_PUBLIC_SUPABASE_URL` — the project ref in the URL must match the intended project.
