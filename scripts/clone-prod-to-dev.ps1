##############################################################################
# NurseLinks — Clone production Supabase → dev (Frankfurt)
# Run from repo root:
#   .\scripts\clone-prod-to-dev.ps1 -DevRef YOUR_DEV_REF -DevPass '...' -ProdPass '...'
#
# Or create env.clone.local (see env.clone.example) and run:
#   .\scripts\clone-prod-to-dev.ps1
##############################################################################

param(
    [string]$ProdRef = "ljfycjqawngzzrahyxsl",
    [string]$ProdPass = "",
    [string]$DevRef = "",
    [string]$DevPass = "",
    [string]$DevAnonKey = "",
    [string]$DevServiceRoleKey = "",
    [switch]$SkipSchema,
    [switch]$SkipData,
    [switch]$SkipStorage,
    [switch]$SkipEnvLocal
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
if (Test-Path $pgBin) {
    $env:PATH = "$pgBin;$env:PATH"
}

function Read-CloneEnvFile {
    $path = Join-Path $PSScriptRoot "..\env.clone.local"
    if (-not (Test-Path $path)) {
        return @{}
    }
    $vars = @{}
    foreach ($line in Get-Content $path) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith("#")) { continue }
        $eq = $t.IndexOf("=")
        if ($eq -lt 1) { continue }
        $vars[$t.Substring(0, $eq).Trim()] = $t.Substring($eq + 1).Trim()
    }
    return $vars
}

$fileEnv = Read-CloneEnvFile
if (-not $ProdPass -and $fileEnv["PROD_DB_PASSWORD"]) { $ProdPass = $fileEnv["PROD_DB_PASSWORD"] }
if (-not $DevRef -and $fileEnv["DEV_REF"]) { $DevRef = $fileEnv["DEV_REF"] }
if (-not $DevPass -and $fileEnv["DEV_DB_PASSWORD"]) { $DevPass = $fileEnv["DEV_DB_PASSWORD"] }
if (-not $DevAnonKey -and $fileEnv["DEV_ANON_KEY"]) { $DevAnonKey = $fileEnv["DEV_ANON_KEY"] }
if (-not $DevServiceRoleKey -and $fileEnv["DEV_SERVICE_ROLE_KEY"]) { $DevServiceRoleKey = $fileEnv["DEV_SERVICE_ROLE_KEY"] }
if ($fileEnv["PROD_REF"]) { $ProdRef = $fileEnv["PROD_REF"] }

function Require-Param([string]$val, [string]$name) {
    if (-not $val) { throw "Missing required: $name (param or env.clone.local)" }
}

Require-Param $ProdPass "ProdPass / PROD_DB_PASSWORD"
Require-Param $DevRef "DevRef / DEV_REF"
Require-Param $DevPass "DevPass / DEV_DB_PASSWORD"

$env:PGPASSWORD = $ProdPass
$env:PGSSLMODE = "require"

function Db-Host([string]$ref) { "db.$ref.supabase.co" }

function Run-Psql-Host([string]$ref, [string]$pass, [string]$file) {
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $pass
    Write-Host "  psql @$ref → $(Split-Path $file -Leaf)" -ForegroundColor DarkCyan
    & psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password --file=$file --no-psqlrc --quiet
    if ($LASTEXITCODE -ne 0) { throw "psql failed: $file" }
    $env:PGPASSWORD = $prev
}

function Run-PgDump-Host([string]$ref, [string]$pass, [string]$file, [string[]]$extra) {
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $pass
    Write-Host "  pg_dump @$ref → $(Split-Path $file -Leaf)" -ForegroundColor DarkCyan
    & pg_dump -h (Db-Host $ref) -p 5432 -U postgres -d postgres @extra --file=$file --no-owner --no-acl
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }
    $env:PGPASSWORD = $prev
}

$dumpDir = Join-Path $PSScriptRoot "..\supabase\migration-dumps"
New-Item -ItemType Directory -Force -Path $dumpDir | Out-Null

$authDump = Join-Path $dumpDir "auth-data.sql"
$publicDump = Join-Path $dumpDir "public-data.sql"
$preRestore = Join-Path $dumpDir "pre-restore.sql"
$cleanDev = Join-Path $dumpDir "clean-dev-before-restore.sql"
$postRestore = Join-Path $dumpDir "post-restore.sql"

Write-Host ""
Write-Host "=== Clone production → dev ===" -ForegroundColor Cyan
Write-Host "  PROD: $ProdRef"
Write-Host "  DEV:  $DevRef"
Write-Host ""

# ─── schema on dev (if empty / first run) ─────────────────────────────────────

if (-not $SkipSchema) {
    Write-Host 'PHASE 1 - Schema on dev [skip if already applied]...' -ForegroundColor Yellow
    $combined = Join-Path $PSScriptRoot "..\supabase\migration-combined-schema.sql"
    if (Test-Path $combined) {
        Run-Psql-Host $DevRef $DevPass $combined
        Write-Host "  Schema applied." -ForegroundColor Green
    } else {
        Write-Host "  SKIP: migration-combined-schema.sql not found" -ForegroundColor DarkYellow
    }
}

# ─── dump prod ───────────────────────────────────────────────────────────────

if (-not $SkipData) {
    Write-Host ""
    Write-Host 'PHASE 2 - Dump from production...' -ForegroundColor Yellow

    Run-PgDump-Host $ProdRef $ProdPass $authDump @(
        "--data-only", "--schema=auth",
        "--table=auth.users", "--table=auth.identities",
        "--table=auth.sessions", "--table=auth.refresh_tokens",
        "--table=auth.mfa_factors", "--table=auth.mfa_challenges"
    )
    Run-PgDump-Host $ProdRef $ProdPass $publicDump @("--data-only", "--schema=public")
    Write-Host "  Dumps saved." -ForegroundColor Green

    Write-Host ""
    Write-Host 'PHASE 3 - Restore into dev...' -ForegroundColor Yellow

    if (-not (Test-Path $cleanDev)) { throw "Missing $cleanDev" }
    Run-Psql-Host $DevRef $DevPass $cleanDev

    Write-Host "  auth..."
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $DevPass
    & psql -h (Db-Host $DevRef) -p 5432 -U postgres -d postgres --no-password `
        --file=$authDump --no-psqlrc --quiet 2>&1 | Where-Object {
            $_ -notmatch "already exists|duplicate key|does not exist"
        }
    $env:PGPASSWORD = $prev

    Write-Host "  clear trigger-created profiles..."
    $truncateProfiles = Join-Path $dumpDir "truncate-profiles-before-public.sql"
    "SET session_replication_role = replica;`nTRUNCATE public.profiles CASCADE;" | Set-Content -Path $truncateProfiles -Encoding ascii
    Run-Psql-Host $DevRef $DevPass $truncateProfiles

    Write-Host "  public..."
    Run-Psql-Host $DevRef $DevPass $publicDump

    if (Test-Path $postRestore) {
        Run-Psql-Host $DevRef $DevPass $postRestore
    }

    Write-Host "  Data restore done." -ForegroundColor Green
}

# ─── storage URLs ────────────────────────────────────────────────────────────

Write-Host ""
Write-Host 'PHASE 4 - Fix storage URLs in dev DB...' -ForegroundColor Yellow

$prodBase = "https://${ProdRef}.supabase.co"
$devBase = "https://${DevRef}.supabase.co"
$legacyBase = "https://prawvpwhgwajhmoomaih.supabase.co"

$urlFixFile = Join-Path $dumpDir "fix-urls-dev.sql"
$sqlFix = @(
    'UPDATE public.profiles SET avatar_url = replace(avatar_url, ''{0}'', ''{1}'') WHERE avatar_url LIKE ''%{2}.supabase.co%'';' -f $prodBase, $devBase, $ProdRef
    'UPDATE public.posts SET image_url = replace(image_url, ''{0}'', ''{1}'') WHERE image_url LIKE ''%{2}.supabase.co%'';' -f $prodBase, $devBase, $ProdRef
    'UPDATE public.job_applications SET cv_url = replace(cv_url, ''{0}'', ''{1}'') WHERE cv_url LIKE ''%{2}.supabase.co%'';' -f $prodBase, $devBase, $ProdRef
    'UPDATE public.profiles SET avatar_url = replace(avatar_url, ''{0}'', ''{1}'') WHERE avatar_url LIKE ''%prawvpwhgwajhmoomaih.supabase.co%'';' -f $legacyBase, $devBase
    'UPDATE public.posts SET image_url = replace(image_url, ''{0}'', ''{1}'') WHERE image_url LIKE ''%prawvpwhgwajhmoomaih.supabase.co%'';' -f $legacyBase, $devBase
    'UPDATE public.job_applications SET cv_url = replace(cv_url, ''{0}'', ''{1}'') WHERE cv_url LIKE ''%prawvpwhgwajhmoomaih.supabase.co%'';' -f $legacyBase, $devBase
)
$sqlFix | Set-Content -Path $urlFixFile -Encoding utf8
Run-Psql-Host $DevRef $DevPass $urlFixFile

# ─── storage files ───────────────────────────────────────────────────────────

if (-not $SkipStorage) {
    Write-Host ""
    Write-Host 'PHASE 5 - Copy storage buckets [requires supabase login]...' -ForegroundColor Yellow

    $buckets = @("avatars", "post-images", "job-applications")
    foreach ($bucket in $buckets) {
        $localDir = Join-Path $dumpDir "storage\$bucket"
        New-Item -ItemType Directory -Force -Path $localDir | Out-Null

        Write-Host "  $bucket from prod..." -ForegroundColor DarkCyan
        & supabase storage cp --recursive "ss://$bucket" $localDir --project-ref $ProdRef 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $bucket to dev..." -ForegroundColor DarkCyan
            & supabase storage cp --recursive $localDir "ss://$bucket" --project-ref $DevRef 2>&1
            Write-Host "  $bucket done." -ForegroundColor Green
        } else {
            Write-Host "  $bucket skipped - CLI login or empty bucket." -ForegroundColor DarkYellow
        }
    }
}

# ─── .env.local ──────────────────────────────────────────────────────────────

if (-not $SkipEnvLocal) {
    if (-not $DevAnonKey -or -not $DevServiceRoleKey) {
        Write-Host ""
        Write-Host 'Skipping .env.local update - set DEV_ANON_KEY and DEV_SERVICE_ROLE_KEY in env.clone.local' -ForegroundColor DarkYellow
    } else {
        Write-Host ""
        Write-Host 'PHASE 6 - Updating .env.local for localhost dev...' -ForegroundColor Yellow
        & node (Join-Path $PSScriptRoot "apply-dev-env.mjs") `
            --dev-ref $DevRef `
            --dev-url "https://${DevRef}.supabase.co" `
            --dev-anon $DevAnonKey `
            --dev-service $DevServiceRoleKey
        Write-Host "  .env.local updated." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dev clone complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  1. Dev project → Authentication → URL Configuration:"
Write-Host "       Site URL: http://localhost:3000"
Write-Host "       Redirects: http://localhost:3000/auth/callback"
Write-Host "                    http://localhost:3000/auth/confirm"
Write-Host "                    http://localhost:3000/auth/confirm?**"
Write-Host "  2. npm run check:env"
Write-Host '  3. npm run dev -> http://localhost:3000 [yellow theme + DEV banner]'
Write-Host "========================================" -ForegroundColor Cyan
