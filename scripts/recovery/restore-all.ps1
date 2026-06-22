##############################################################################
# NurseLinks - Full disaster-recovery RESTORE (from local archive)
#
# Restores:
#   1. auth.users + auth.identities (optional, default on)
#   2. public schema (DROP + replay dump)
#   3. post-restore-public-schema.sql (triggers, grants, missing profiles)
#   4. storage buckets from archive
#
#   OVERWRITES the target Supabase project in env.recovery.local
#
# Run from repo root:
#   npm run recovery:restore -- -ArchivePath scripts/recovery/archives/prod-full-... -Confirm RESTORE
##############################################################################

param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath,
    [Parameter(Mandatory = $true)]
    [string]$Confirm,
    [switch]$SkipAuth,
    [switch]$SkipStorage,
    [switch]$SkipPostRestore
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
if (Test-Path $pgBin) { $env:PATH = "$pgBin;$env:PATH" }

if ($Confirm.Trim().ToUpper() -ne "RESTORE") {
    throw "Safety check: pass -Confirm RESTORE exactly"
}

$archive = Resolve-Path $ArchivePath
$publicSql = Join-Path $archive "public-schema.sql"
$publicGz = Join-Path $archive "public-schema.sql.gz"
$authSql = Join-Path $archive "auth-data.sql"
$storageDir = Join-Path $archive "storage"
$postRestore = Join-Path $PSScriptRoot "..\..\supabase\post-restore-public-schema.sql"
$cleanSql = Join-Path $PSScriptRoot "prepare-restore.sql"

if (-not (Test-Path $publicSql) -and -not (Test-Path $publicGz)) {
    throw "Missing public-schema.sql (or .sql.gz) in $archive"
}

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

$cfg = Read-RecoveryEnv
$ref = $cfg["PROJECT_REF"]
$pass = $cfg["DB_PASSWORD"]
$poolerHost = $cfg["DB_POOLER_HOST"]
if (-not $ref -or -not $pass) { throw "PROJECT_REF and DB_PASSWORD required" }
if (-not $poolerHost) { throw "DB_POOLER_HOST is required. Get it from Supabase Dashboard -> Connect -> Session pooler hostname." }

$dbHost = $poolerHost
$dbUser = "postgres.$ref"

function Invoke-Psql([string]$file) {
    Write-Host "  psql -> $(Split-Path $file -Leaf)" -ForegroundColor DarkCyan
    & psql -h $dbHost -p 5432 -U $dbUser -d postgres `
        --no-password --file=$file --no-psqlrc --set=ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "psql failed: $file" }
}

function Invoke-PsqlPipe([string]$inputFile) {
    Write-Host "  psql <- $(Split-Path $inputFile -Leaf)" -ForegroundColor DarkCyan
    # ON_ERROR_STOP=0: skip rows that violate FK constraints (e.g. profiles whose
    # auth.users row is missing from this dump) and continue restoring everything else.
    # The post-restore script cleans up any orphaned rows afterwards.
    & psql -h $dbHost -p 5432 -U $dbUser -d postgres `
        --no-password --no-psqlrc --set=ON_ERROR_STOP=0 --file=$inputFile
    if ($LASTEXITCODE -ne 0) { throw "psql pipe failed: $inputFile" }
}

$env:PGPASSWORD = $pass
$env:PGSSLMODE = "require"
$env:PGCLIENTENCODING = "UTF8"

Write-Host ""
Write-Host "=== NurseLinks FULL RESTORE ===" -ForegroundColor Red
Write-Host "  Target project: $ref"
Write-Host "  Host:           $dbHost (pooler)"
Write-Host "  Archive:        $archive"
Write-Host ""
Write-Host "This will OVERWRITE auth + public data on the target project." -ForegroundColor Red
Write-Host ""

if (-not $SkipAuth -and (Test-Path $authSql)) {
    Write-Host "1/4  Restore auth (users + identities)..." -ForegroundColor Yellow
    Invoke-Psql $cleanSql
    & psql -h $dbHost -p 5432 -U $dbUser -d postgres --no-password `
        --file=$authSql --no-psqlrc --quiet 2>&1 | Where-Object {
            $_ -notmatch "already exists|duplicate key|does not exist"
        }
    if ($LASTEXITCODE -ne 0) { throw "auth restore failed" }
    Write-Host "     auth restored" -ForegroundColor Green
} elseif ($SkipAuth) {
    Write-Host "1/4  Skipped auth (-SkipAuth)" -ForegroundColor DarkYellow
} else {
    Write-Host "1/4  No auth-data.sql - keeping existing auth.users" -ForegroundColor DarkYellow
}

Write-Host "2/4  Restore public schema..." -ForegroundColor Yellow

# Drop public schema, recreate it, then immediately re-enable required
# extensions so their operator classes (e.g. gin_trgm_ops) exist before
# the dump tries to create GIN indexes that reference them.
Write-Host "     Resetting public schema + enabling extensions..." -ForegroundColor DarkCyan
& psql -h $dbHost -p 5432 -U $dbUser -d postgres --no-password --no-psqlrc `
    --set=ON_ERROR_STOP=1 --command="
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
CREATE EXTENSION IF NOT EXISTS pgcrypto  SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_trgm   SCHEMA public;
"
if ($LASTEXITCODE -ne 0) { throw "Schema reset / extension enable failed" }

$tempSql = Join-Path $env:TEMP "nurselinks-restore-$([guid]::NewGuid().Guid).sql"
if (Test-Path $publicSql) {
    Copy-Item $publicSql $tempSql
} elseif (Test-Path $publicGz) {
    if (-not (Get-Command gzip -ErrorAction SilentlyContinue)) {
        throw "Archive has .sql.gz only - install gzip (Git for Windows) or re-backup as plain .sql"
    }
    cmd /c "gzip -dc `"$publicGz`" > `"$tempSql`""
    if ($LASTEXITCODE -ne 0) { throw "gunzip failed" }
} else {
    throw "No public schema file found"
}

# Strip lines that conflict with the schema/extension setup we already ran:
#   - \restrict / \unrestrict (pg_dump 17 artefacts)
#   - CREATE SCHEMA public (we already created it above)
#   - CREATE EXTENSION pgcrypto / pg_trgm (already enabled above)
$content = [System.IO.File]::ReadAllText($tempSql, [System.Text.Encoding]::UTF8)
$content = $content `
    -replace '(?m)^\\restrict .*\r?\n', '' `
    -replace '(?m)^\\unrestrict .*\r?\n', '' `
    -replace '(?mi)^CREATE SCHEMA public\s*;\r?\n', '' `
    -replace '(?mi)^CREATE EXTENSION\s+IF NOT EXISTS\s+(pgcrypto|pg_trgm)\b[^\r\n]*\r?\n', '' `
    -replace '(?mi)^CREATE EXTENSION\s+(pgcrypto|pg_trgm)\b[^\r\n]*\r?\n', ''
# Write UTF-8 without BOM so psql reads Hebrew/Unicode correctly.
[System.IO.File]::WriteAllText($tempSql, $content, (New-Object System.Text.UTF8Encoding $false))

Invoke-PsqlPipe $tempSql
Remove-Item -Force $tempSql -ErrorAction SilentlyContinue
Write-Host "     public schema restored" -ForegroundColor Green

if (-not $SkipPostRestore -and (Test-Path $postRestore)) {
    Write-Host "3/4  Post-restore repair (triggers, grants, profiles)..." -ForegroundColor Yellow
    Invoke-Psql $postRestore
    Write-Host "     post-restore complete" -ForegroundColor Green
} else {
    Write-Host "3/4  Skipped post-restore" -ForegroundColor DarkYellow
}

if (-not $SkipStorage -and (Test-Path $storageDir)) {
    Write-Host "4/4  Restore storage files..." -ForegroundColor Yellow
    & node (Join-Path $PSScriptRoot "restore-storage.mjs") --dir $storageDir
    if ($LASTEXITCODE -ne 0) { throw "storage restore failed" }
} else {
    Write-Host "4/4  Skipped storage" -ForegroundColor DarkYellow
}

# Re-apply security hardening — the DROP SCHEMA CASCADE during restore wipes
# the hardened is_admin() function, the profiles_public view, and the
# suspension RLS policy. Always re-run this after a full restore.
$securitySql = Join-Path $PSScriptRoot "..\..\supabase\security-hardening.sql"
if (Test-Path $securitySql) {
    Write-Host "5/5  Re-applying security hardening..." -ForegroundColor Yellow
    Invoke-Psql $securitySql
    Write-Host "     Security hardening applied" -ForegroundColor Green
} else {
    Write-Host "5/5  supabase/security-hardening.sql not found - run it manually in SQL Editor" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restore complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verify:" -ForegroundColor Yellow
Write-Host "  - Log OUT and back IN (session must refresh)"
Write-Host "  - Feed, jobs, messages load"
Write-Host "  - Profile photos / CV downloads work"
Write-Host "  - /admin/backups shows history"
Write-Host "========================================" -ForegroundColor Cyan
