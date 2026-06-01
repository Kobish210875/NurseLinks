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

Only when everything works locally, continue to **Step 2** (Preview) — do **not** push to `main` yet if you want to avoid touching Production.

---

## Step 2 — Online Preview (test on the internet, NOT production)

### What is Preview?

Vercel has **two deployment types**:

| Type | Trigger | URL | Who sees it |
|------|---------|-----|-------------|
| **Production** | push to `main` | https://nurselinks.net | Real users |
| **Preview** | push to any **other** branch (e.g. `develop`) | `https://nurselinks-xxxxx.vercel.app` | Only you / team |

**Step 2 goal:** Work on branch `develop` → get a **Preview URL** → test online → only then merge to `main` for Production.

```
localhost (Step 1)  →  Preview / develop (Step 2)  →  Production / main
     dev DB                  dev DB                        prod DB
```

---

### 2A. Create the `develop` branch (one time)

On your laptop, in the project folder:

```powershell
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

After this, GitHub has two branches: `main` and `develop`.

---

### 2B. Vercel — separate env vars for Preview vs Production

1. Open https://vercel.com → your **NurseLinks** project  
2. **Settings** → **Environment Variables**

For **each** variable below, add it **twice** if needed — once for **Production**, once for **Preview**  
(when adding a variable, Vercel asks which environments to apply it to).

#### Production only (keep existing prod values)

Apply to: **Production** ✓ only

| Variable | Example value |
|----------|----------------|
| `NEXT_PUBLIC_APP_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://nurselinks.net` |
| `NEXT_PUBLIC_SUPABASE_URL` | your **prod** Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod service role |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `true` |

#### Preview only (use DEV Supabase — same as localhost)

Apply to: **Preview** ✓ only (NOT Production)

| Variable | Example value |
|----------|----------------|
| `NEXT_PUBLIC_APP_ENV` | `preview` |
| `NEXT_PUBLIC_APP_URL` | `https://nurselinks.net` (or leave; Preview uses its own URL for auth) |
| `NEXT_PUBLIC_SUPABASE_URL` | your **dev** Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | dev service role |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `false` |

**Important:** Preview must **not** use production Supabase keys.

3. **Settings** → **Git** → confirm **Production Branch** = `main`

---

### 2C. Supabase DEV — allow Preview URLs

In your **dev** Supabase project (not prod):

**Authentication** → **URL Configuration** → **Redirect URLs**, add:

```
https://*.vercel.app/auth/callback
https://*.vercel.app/auth/confirm
https://*.vercel.app/auth/confirm?**
```

(Keep the localhost URLs from Step 1.)

---

### 2D. Daily workflow after Step 2 is set up

**Always work on `develop`, not `main`:**

```powershell
git checkout develop
git pull origin develop
npm run dev
# test on http://localhost:3000
npm run build
git add .
git commit -m "describe your change"
git push origin develop
```

**What happens:** Vercel builds a **Preview** deployment (not Production).  
Open Vercel → **Deployments** → find the latest **Preview** → click **Visit**.

Test on that Preview URL. Real users on nurselinks.net are **not** affected.

---

### 2E. Release to Production (only when Preview looks good)

```powershell
git checkout main
git pull origin main
git merge develop
git push origin main
```

That updates **Production** (nurselinks.net).

Then sync develop:

```powershell
git checkout develop
git merge main
git push origin develop
```

---

### 2F. How to tell Preview vs Production in Vercel

In **Deployments** list (your screenshot):

- Tag **Production** + green dot = live site (`main` branch)
- Tag **Preview** = safe test URL (`develop` or other branches)

Filter dropdown: **Preview** shows only test deploys.

---

### Step 2 checklist

- [ ] Branch `develop` exists on GitHub
- [ ] Vercel Preview env vars → **dev** Supabase
- [ ] Vercel Production env vars → **prod** Supabase
- [ ] Dev Supabase redirect URLs include `https://*.vercel.app/...`
- [ ] Pushed to `develop` and opened Preview URL successfully
- [ ] Stopped pushing directly to `main` for experiments

---

## Step 3 — Production checklist (before merge to `main`)

- [ ] Tested on `http://localhost:3000`
- [ ] Tested on Vercel **Preview** URL (from `develop` push)
- [ ] `npm run build` passes
- [ ] `.env.local` uses **dev** Supabase (not production)
- [ ] No secrets committed (`.env.local` is gitignored)

---

## Quick reference

| | Localhost | Preview (Vercel) | Production |
|---|-----------|------------------|------------|
| URL | http://localhost:3000 | `*.vercel.app` | https://nurselinks.net |
| Git branch | any (local) | `develop` | `main` |
| Config | `.env.local` | Vercel **Preview** vars | Vercel **Production** vars |
| Database | Supabase **dev** | Supabase **dev** | Supabase **prod** |
| Deploy command | `npm run dev` | `git push origin develop` | `git merge` + `git push origin main` |
| Banner | Orange DEV MODE | None | None |
