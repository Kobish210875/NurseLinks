# Dev / Prod workflow (step by step)

**Rule:** Code on `main` → Vercel **Production** → live users.  
**Never test on Production.** Test only on **localhost** with a **separate Supabase dev project**.

---

## Step 1 — Local DEV on localhost (do this first)

### 1A. Create a Supabase DEV project

1. Open https://supabase.com/dashboard
2. **New project** → name: `nurselinks-dev`
3. Wait until the project is ready

### 1B. Run database schema on DEV

In the **dev** project → **SQL Editor**, run files from `supabase/` **in order** (same as production):

Start with: `schema.sql`, then follow the list in `supabase/README.md`.

### 1C. Auth URLs on DEV Supabase

**Dev project only** → Authentication → URL Configuration:

| Field | Value |
|-------|--------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/auth/confirm` |
| | `http://localhost:3000/auth/confirm?**` |

### 1D. Create `.env.local` (your laptop only — never commit)

```powershell
copy .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-DEV-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
AUTH_REQUIRE_EMAIL_VERIFICATION=false
```

Get URL + keys from **dev** project → Settings → API.

**Important:** Do not copy production keys from Vercel into `.env.local`.

### 1E. Verify and start

```powershell
npm install
npm run check:env
npm run dev
```

Open http://localhost:3000 — you should see an orange **DEV MODE** banner at the top.

### 1F. Daily workflow (local only)

```powershell
git pull
npm run dev
# test changes at http://localhost:3000
npm run build
```

Only when everything works locally:

```powershell
git add .
git commit -m "your message"
git push origin main
```

That push deploys to **Production**. Test thoroughly on localhost first.

---

## Step 2 — Preview branch (next, not yet)

We will add a `develop` branch and Vercel **Preview** so you can test online without touching Production.

---

## Step 3 — Production checklist (before every push to main)

- [ ] Tested on `http://localhost:3000`
- [ ] `npm run build` passes
- [ ] `.env.local` uses **dev** Supabase (not production)
- [ ] No secrets committed (`.env.local` is gitignored)

---

## Quick reference

| | Localhost DEV | Production |
|---|---------------|------------|
| URL | http://localhost:3000 | https://nurselinks.net |
| Config | `.env.local` | Vercel → Production env vars |
| Database | Supabase **dev** project | Supabase **prod** project |
| Deploy | `npm run dev` | `git push origin main` |
| Banner | Orange DEV MODE | None |
