##############################################################################
# NurseLinks — Supabase Sydney → Frankfurt migration script
# Run from the repo root:  .\scripts\migrate-to-eu.ps1
##############################################################################

param(
    [string]$OldRef    = "ierxzktclczfgkdrszqv",   # Sydney project (do not change)
    [string]$OldPass   = "",                          # Old DB password
    [string]$NewRef    = "",                          # New Frankfurt project ref
    [string]$NewPass   = "",                          # New DB password
    [switch]$SkipSchema,                              # Skip schema (already done)
    [switch]$SkipData,                                # Skip data dump/restore
    [switch]$SkipStorage                              # Skip storage file migration
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── helpers ─────────────────────────────────────────────────────────────────

function Check-Param([string]$val, [string]$name) {
    if (-not $val) { throw "Missing required parameter: -$name" }
}

function Pg-Uri([string]$ref, [string]$pass) {
    return "postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres"
}

function Run-Psql([string]$uri, [string]$file) {
    Write-Host "  psql → $file" -ForegroundColor DarkCyan
    & psql $uri --file=$file --no-psqlrc --quiet
    if ($LASTEXITCODE -ne 0) { throw "psql failed on $file" }
}

function Run-PgDump([string]$uri, [string]$file, [string[]]$extra) {
    Write-Host "  pg_dump → $file" -ForegroundColor DarkCyan
    & pg_dump $uri @extra --file=$file --no-owner --no-acl
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }
}

# ─── validate inputs ─────────────────────────────────────────────────────────

Check-Param $OldPass "OldPass"
Check-Param $NewRef  "NewRef"
Check-Param $NewPass "NewPass"

$oldUri = Pg-Uri $OldRef $OldPass
$newUri = Pg-Uri $NewRef $NewPass

$dumpDir = Join-Path $PSScriptRoot "..\supabase\migration-dumps"
New-Item -ItemType Directory -Force -Path $dumpDir | Out-Null

$authDump   = Join-Path $dumpDir "auth-data.sql"
$publicDump = Join-Path $dumpDir "public-data.sql"

Write-Host ""
Write-Host "=== NurseLinks Supabase Migration ===" -ForegroundColor Cyan
Write-Host "  OLD: $OldRef (Sydney)"
Write-Host "  NEW: $NewRef (Frankfurt)"
Write-Host ""

# ─── phase 1: schema ─────────────────────────────────────────────────────────

if (-not $SkipSchema) {
    Write-Host "PHASE 1 — Applying schema to new project..." -ForegroundColor Yellow

    $schemaFiles = @(
        "schema.sql",
        "storage.sql",
        "post-images.sql",
        "feed-social.sql",
        "feed-post-delete.sql",
        "jobs.sql",
        "jobs-scaling.sql",
        "job-applications.sql",
        "job-applications-seen.sql",
        "job-applications-read.sql",
        "job-applications-cv.sql",
        "profile-workplace.sql",
        "medical-institutions.sql",
        "connections-messaging.sql",
        "messages-open-send.sql",
        "profile-cv.sql",
        "recommendation-snapshots.sql",
        "recommendation-workplace.sql",
        "moderation.sql",
        "admin.sql",
        "account-deletion-and-recommendations.sql",
        "post-shares.sql",
        "post-comment-replies.sql",
        "post-comment-likes.sql",
        "connection-remove-friend.sql",
        "recommendation-dismissals.sql",
        "profile-cv-fix.sql",
        "connections-messaging-fix.sql"
    )

    foreach ($f in $schemaFiles) {
        $path = Join-Path $PSScriptRoot "..\supabase\$f"
        if (Test-Path $path) {
            Run-Psql $newUri $path
        } else {
            Write-Host "  SKIP (not found): $f" -ForegroundColor DarkGray
        }
    }

    Write-Host "  Schema done." -ForegroundColor Green
}

# ─── phase 2: data dump + restore ────────────────────────────────────────────

if (-not $SkipData) {
    Write-Host ""
    Write-Host "PHASE 2 — Dumping data from Sydney..." -ForegroundColor Yellow

    Run-PgDump $oldUri $authDump @(
        "--data-only",
        "--schema=auth",
        "--table=auth.users",
        "--table=auth.identities",
        "--table=auth.sessions",
        "--table=auth.refresh_tokens",
        "--table=auth.mfa_factors",
        "--table=auth.mfa_challenges"
    )
    Write-Host "  auth dump done: $authDump" -ForegroundColor Green

    Run-PgDump $oldUri $publicDump @(
        "--data-only",
        "--schema=public"
    )
    Write-Host "  public dump done: $publicDump" -ForegroundColor Green

    Write-Host ""
    Write-Host "PHASE 2 — Restoring data to Frankfurt..." -ForegroundColor Yellow

    Write-Host "  Restoring auth users (may show harmless warnings)..."
    & psql $newUri --file=$authDump --no-psqlrc --quiet 2>&1 | Where-Object { $_ -notmatch "already exists|duplicate key" }

    Write-Host "  Restoring public data..."
    Run-Psql $newUri $publicDump

    Write-Host "  Data restore done." -ForegroundColor Green
}

# ─── phase 3: fix storage URLs in DB ─────────────────────────────────────────

Write-Host ""
Write-Host "PHASE 3 — Fixing storage URLs in database..." -ForegroundColor Yellow

$oldBase = "https://${OldRef}.supabase.co"
$newBase = "https://${NewRef}.supabase.co"

$urlFixSql = @"
UPDATE public.profiles
SET avatar_url = replace(avatar_url, '$oldBase', '$newBase')
WHERE avatar_url LIKE '%${OldRef}.supabase.co%';

UPDATE public.posts
SET image_url = replace(image_url, '$oldBase', '$newBase')
WHERE image_url LIKE '%${OldRef}.supabase.co%';

UPDATE public.job_applications
SET cv_url = replace(cv_url, '$oldBase', '$newBase')
WHERE cv_url LIKE '%${OldRef}.supabase.co%';
"@

$urlFixFile = Join-Path $dumpDir "fix-storage-urls.sql"
$urlFixSql | Out-File -FilePath $urlFixFile -Encoding utf8

Run-Psql $newUri $urlFixFile
Write-Host "  Storage URLs fixed." -ForegroundColor Green

# ─── phase 4: storage files ───────────────────────────────────────────────────

if (-not $SkipStorage) {
    Write-Host ""
    Write-Host "PHASE 4 — Migrating storage files..." -ForegroundColor Yellow

    $buckets = @("avatars", "post-images", "job-applications")

    foreach ($bucket in $buckets) {
        $localDir = Join-Path $dumpDir "storage\$bucket"
        New-Item -ItemType Directory -Force -Path $localDir | Out-Null

        Write-Host "  Downloading bucket: $bucket from $OldRef..." -ForegroundColor DarkCyan
        & supabase storage cp --recursive "ss://$bucket" $localDir --project-ref $OldRef 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Uploading bucket: $bucket to $NewRef..." -ForegroundColor DarkCyan
            & supabase storage cp --recursive $localDir "ss://$bucket" --project-ref $NewRef 2>&1
            Write-Host "  $bucket migrated." -ForegroundColor Green
        } else {
            Write-Host "  $bucket: download failed or empty — skipping." -ForegroundColor DarkYellow
        }
    }
}

# ─── done ─────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. In Supabase new project → Authentication → URL Configuration:"
Write-Host "       Site URL: https://nurselinks.net"
Write-Host "       Redirect URLs: https://nurselinks.net/auth/confirm"
Write-Host "                      https://nurselinks.net/auth/confirm?**"
Write-Host "                      https://nurselinks.net/reset-password"
Write-Host "                      https://nurselinks.net/auth/callback"
Write-Host ""
Write-Host "  2. In Vercel → Project Settings → Environment Variables (Production):"
Write-Host "       NEXT_PUBLIC_SUPABASE_URL  = https://${NewRef}.supabase.co"
Write-Host "       NEXT_PUBLIC_SUPABASE_ANON_KEY = <new anon key>"
Write-Host "       SUPABASE_SERVICE_ROLE_KEY     = <new service_role key>"
Write-Host ""
Write-Host "  3. Vercel → Deployments → Redeploy latest."
Write-Host ""
Write-Host "  4. Smoke test production, then delete the old Sydney project after 7 days."
Write-Host "========================================" -ForegroundColor Cyan
