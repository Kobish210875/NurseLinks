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

function Db-Host([string]$ref) { "db.$ref.supabase.co" }

function Invoke-Psql([string]$hostRef, [string]$pass, [string]$file) {
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $pass
    Write-Host "  psql -> $(Split-Path $file -Leaf)" -ForegroundColor DarkCyan
    & psql -h (Db-Host $hostRef) -p 5432 -U postgres -d postgres `
        --no-password --file=$file --no-psqlrc --set=ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "psql failed: $file" }
    $env:PGPASSWORD = $prev
}

function Invoke-PsqlPipe([string]$hostRef, [string]$pass, [string]$inputFile) {
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $pass
    Write-Host "  psql <- $(Split-Path $inputFile -Leaf)" -ForegroundColor DarkCyan
    Get-Content $inputFile -Raw | & psql -h (Db-Host $hostRef) -p 5432 -U postgres -d postgres `
        --no-password --no-psqlrc --set=ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "psql pipe failed: $inputFile" }
    $env:PGPASSWORD = $prev
}

$cfg = Read-RecoveryEnv
$ref = $cfg["PROJECT_REF"]
$pass = $cfg["DB_PASSWORD"]
if (-not $ref -or -not $pass) { throw "PROJECT_REF and DB_PASSWORD required" }

$env:PGSSLMODE = "require"

Write-Host ""
Write-Host "=== NurseLinks FULL RESTORE ===" -ForegroundColor Red
Write-Host "  Target project: $ref"
Write-Host "  Archive:        $archive"
Write-Host ""
Write-Host "This will OVERWRITE auth + public data on the target project." -ForegroundColor Red
Write-Host ""

if (-not $SkipAuth -and (Test-Path $authSql)) {
    Write-Host "1/4  Restore auth (users + identities)..." -ForegroundColor Yellow
    Invoke-Psql $ref $pass $cleanSql
    $prev = $env:PGPASSWORD
    $env:PGPASSWORD = $pass
    & psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password `
        --file=$authSql --no-psqlrc --quiet 2>&1 | Where-Object {
            $_ -notmatch "already exists|duplicate key|does not exist"
        }
    if ($LASTEXITCODE -ne 0) { throw "auth restore failed" }
    $env:PGPASSWORD = $prev
    Write-Host "     auth restored" -ForegroundColor Green
} elseif ($SkipAuth) {
    Write-Host "1/4  Skipped auth (-SkipAuth)" -ForegroundColor DarkYellow
} else {
    Write-Host "1/4  No auth-data.sql - keeping existing auth.users" -ForegroundColor DarkYellow
}

Write-Host "2/4  Restore public schema..." -ForegroundColor Yellow
$prev = $env:PGPASSWORD
$env:PGPASSWORD = $pass
& psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password `
    --command="DROP SCHEMA IF EXISTS public CASCADE;" --no-psqlrc --set=ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "DROP SCHEMA public failed" }

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

# pg_dump 17 may emit \restrict lines that break plain psql replay
(Get-Content $tempSql -Raw) `
    -replace '(?m)^\\restrict .*\r?\n', '' `
    -replace '(?m)^\\unrestrict .*\r?\n', '' |
    Set-Content -Path $tempSql -Encoding utf8

Invoke-PsqlPipe $ref $pass $tempSql
Remove-Item -Force $tempSql -ErrorAction SilentlyContinue
$env:PGPASSWORD = $prev
Write-Host "     public schema restored" -ForegroundColor Green

if (-not $SkipPostRestore -and (Test-Path $postRestore)) {
    Write-Host "3/4  Post-restore repair (triggers, grants, profiles)..." -ForegroundColor Yellow
    Invoke-Psql $ref $pass $postRestore
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Restore complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verify:" -ForegroundColor Yellow
Write-Host "  - Log in as a known user"
Write-Host "  - Feed, jobs, messages load"
Write-Host "  - Profile photos / CV downloads work"
Write-Host "  - /admin/backups shows history"
Write-Host "========================================" -ForegroundColor Cyan
