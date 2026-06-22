# NurseLinks disaster recovery

Sleep-well backups: **database + logins + storage files**, stored locally off-site.

## One-time setup

1. Install [PostgreSQL client tools](https://www.postgresql.org/download/) (you already use `psql` / `pg_dump` for clone scripts).

2. Copy credentials file:

   ```powershell
   copy scripts\recovery\env.recovery.example env.recovery.local
   ```

3. Fill in `env.recovery.local` (PROD values from Supabase Dashboard → Settings → API / Database):

   | Variable | Where |
   |----------|--------|
   | `PROJECT_REF` | Project URL subdomain |
   | `SUPABASE_URL` | Project URL |
   | `DB_PASSWORD` | Database password |
   | `SERVICE_ROLE_KEY` | service_role key |
   | `ENVIRONMENT` | `prod` or `dev` |

4. **Never commit** `env.recovery.local` (gitignored).

---

## Monthly habit (recommended)

```powershell
npm run recovery:backup
```

Creates `scripts/recovery/archives/prod-full-YYYYMMDDTHHMMSSZ/` containing:

| File | Contents |
|------|----------|
| `public-schema.sql` | All app tables (profiles, posts, jobs, messages, …) |
| `auth-data.sql` | Login accounts (`auth.users` + `auth.identities`) |
| `storage/` | Avatars, post images, job-application CVs |
| `manifest.json` | Metadata |

**Copy the whole folder** to OneDrive, an external drive, or another machine.

Verify occasionally:

```powershell
npm run recovery:verify -- -ArchivePath scripts/recovery/archives/prod-full-...
```

---

## What each layer covers

| Disaster | Tool |
|----------|------|
| Bad migration / corrupted `public.*` only | `/admin/backups` → Restore, **or** `npm run recovery:snapshot` |
| Lost logins (`auth.users`) + app data | `npm run recovery:restore` (full archive) |
| Lost storage files (photos, CVs) | Full archive restore (storage step) |
| Vercel / code broken | Redeploy from GitHub `main`; env vars from Vercel dashboard |
| Entire Supabase project deleted | Supabase support / PITR **plus** your local archive |

GitHub scheduled snapshots (every 4h, 3-day retention) cover quick rollbacks but **not** auth or storage.

---

## Restore scenarios

### A — Public data corrupted, logins OK (most common)

**Option 1 — Admin UI (production):**

1. `/admin/backups` → pick a completed snapshot → Restore  
2. GitHub Actions runs automatically (includes `post-restore-public-schema.sql`)

**Option 2 — Local snapshot file:**

```powershell
npm run recovery:snapshot -- `
  -SnapshotPath "C:\Downloads\prod-snapshot-....sql.gz" `
  -Confirm RESTORE
```

Users who signed up **after** the snapshot get a stub profile (can log in, empty history).

---

### B — Everything corrupted (full disaster)

Point `env.recovery.local` at the **target** Supabase project, then:

```powershell
npm run recovery:restore -- `
  -ArchivePath "scripts/recovery/archives/prod-full-20260622T120000Z" `
  -Confirm RESTORE
```

Steps performed:

1. Clear auth sessions → restore `auth.users` + identities  
2. `DROP SCHEMA public CASCADE` → replay `public-schema.sql`  
3. Run `supabase/post-restore-public-schema.sql` (triggers, grants, missing profiles)  
4. Re-upload all storage files  

All users must **sign in again** (sessions cleared). Passwords come from the archive.

---

### C — Restore failed mid-way / cannot log in to admin

**DEV only — login bootstrap:**

Run `supabase/dev-emergency-login-bootstrap.sql` in SQL Editor (replace admin email), then restore from archive or admin UI.

---

## npm commands

| Command | Action |
|---------|--------|
| `npm run recovery:backup` | Full local archive (DB + auth + storage) |
| `npm run recovery:restore -- -ArchivePath ... -Confirm RESTORE` | Full restore |
| `npm run recovery:snapshot -- -SnapshotPath ... -Confirm RESTORE` | Public schema only |
| `npm run recovery:verify -- -ArchivePath ...` | Check archive integrity |

---

## After any restore

1. Log in as admin → `/admin/backups`  
2. Trigger a **manual PROD snapshot** (new baseline)  
3. Smoke-test: feed, jobs, messages, avatar, CV download  
4. Tell users if data from the last few hours was lost (scheduled backup RPO ≈ 4 hours)

---

## Checklist to keep off-site

- [ ] Latest `scripts/recovery/archives/prod-full-*` folder  
- [ ] `env.recovery.local` values (password manager, not git)  
- [ ] Vercel env vars export  
- [ ] Supabase project ref + dashboard access  
