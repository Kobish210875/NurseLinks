##############################################################################
# NurseLinks - Full disaster-recovery BACKUP (local archive)
#
# Backs up:
#   - public schema (all app tables + data)
#   - auth.users + auth.identities (logins)
#   - storage buckets: avatars, post-images, job-applications
#
# Setup:
#   copy scripts/recovery/env.recovery.example -> env.recovery.local
#
# Run from repo root:
#   npm run recovery:backup
#   .\scripts\recovery\backup-all.ps1
#   .\scripts\recovery\backup-all.ps1 -SkipStorage
##############################################################################

param(
    [switch]$SkipStorage,
    [switch]$SkipAuth,
    [string]$ArchiveRoot = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
if (Test-Path $pgBin) { $env:PATH = "$pgBin;$env:PATH" }

function Read-RecoveryEnv {
    $path = Join-Path $PSScriptRoot "..\..\env.recovery.local"
    if (-not (Test-Path $path)) {
        throw "Missing env.recovery.local - copy scripts/recovery/env.recovery.example"
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

function Db-Host([string]$ref) { "db.$ref.supabase.co" }

$cfg = Read-RecoveryEnv
$ref = $cfg["PROJECT_REF"]
$pass = $cfg["DB_PASSWORD"]
$envName = if ($cfg["ENVIRONMENT"]) { $cfg["ENVIRONMENT"] } else { "prod" }
if (-not $ref -or -not $pass) { throw "PROJECT_REF and DB_PASSWORD required in env.recovery.local" }

$root = if ($ArchiveRoot) { $ArchiveRoot } else { Join-Path $PSScriptRoot "archives" }
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd'T'HHmmss'Z'")
$archive = Join-Path $root "$envName-full-$stamp"
New-Item -ItemType Directory -Force -Path $archive | Out-Null

$publicSql = Join-Path $archive "public-schema.sql"
$publicGz = Join-Path $archive "public-schema.sql.gz"
$authSql = Join-Path $archive "auth-data.sql"
$storageDir = Join-Path $archive "storage"
$manifestPath = Join-Path $archive "manifest.json"

Write-Host ""
Write-Host "=== NurseLinks full backup ===" -ForegroundColor Cyan
Write-Host "  Project: $ref ($envName)"
Write-Host "  Archive: $archive"
Write-Host ""

$env:PGPASSWORD = $pass
$env:PGSSLMODE = "require"
$dbHost = Db-Host $ref

Write-Host "1/3  Dump public schema..." -ForegroundColor Yellow
& pg_dump -h $dbHost -p 5432 -U postgres -d postgres `
    --schema=public --no-owner --no-acl --format=plain `
    --file=$publicSql `
    2> "$archive\pg_dump-public.log"
if ($LASTEXITCODE -ne 0) { throw "pg_dump public failed - see pg_dump-public.log" }
$publicSize = (Get-Item $publicSql).Length
Write-Host "     public-schema.sql ($publicSize bytes)" -ForegroundColor Green
if (Get-Command gzip -ErrorAction SilentlyContinue) {
    & gzip -kf $publicSql
    Write-Host "     also wrote public-schema.sql.gz" -ForegroundColor DarkCyan
}

if (-not $SkipAuth) {
    Write-Host "2/3  Dump auth (users + identities)..." -ForegroundColor Yellow
    & pg_dump -h $dbHost -p 5432 -U postgres -d postgres `
        --data-only --schema=auth `
        --table=auth.users --table=auth.identities `
        --no-owner --no-acl `
        --file=$authSql
    if ($LASTEXITCODE -ne 0) { throw "pg_dump auth failed" }
    Write-Host "     auth-data.sql ($((Get-Item $authSql).Length) bytes)" -ForegroundColor Green
} else {
    Write-Host "2/3  Skipped auth dump (-SkipAuth)" -ForegroundColor DarkYellow
}

if (-not $SkipStorage) {
    Write-Host "3/3  Download storage buckets..." -ForegroundColor Yellow
    & node (Join-Path $PSScriptRoot "backup-storage.mjs") --out $storageDir
    if ($LASTEXITCODE -ne 0) { throw "storage backup failed" }
} else {
    Write-Host "3/3  Skipped storage (-SkipStorage)" -ForegroundColor DarkYellow
}

$manifest = @{
    created_at_utc = $stamp
    environment    = $envName
    project_ref    = $ref
    supabase_url   = $cfg["SUPABASE_URL"]
    files          = @{
        public_schema_sql = "public-schema.sql"
        auth_data_sql     = if ($SkipAuth) { $null } else { "auth-data.sql" }
        storage_dir       = if ($SkipStorage) { $null } else { "storage" }
    }
    sizes_bytes    = @{
        public_schema_sql = $publicSize
        auth_data_sql     = if ($SkipAuth) { 0 } else { (Get-Item $authSql).Length }
    }
    notes          = @(
        "Restore with: npm run recovery:restore -- -ArchivePath `"$archive`" -Confirm RESTORE"
        "Keep this folder off-site (USB, cloud drive). Do not commit to git."
    )
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding utf8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backup complete!" -ForegroundColor Green
Write-Host "  $archive"
Write-Host ""
Write-Host "Copy the archive folder to safe storage (OneDrive, external drive)." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
