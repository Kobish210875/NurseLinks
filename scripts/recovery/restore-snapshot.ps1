##############################################################################
# Restore ONLY public schema from a snapshot file (no auth wipe).
# Use when auth.users is fine but public.* is corrupted.
#
# Same as GitHub restore-backup.yml but run locally with env.recovery.local.
#
#   .\scripts\recovery\restore-snapshot.ps1 `
#       -SnapshotPath "C:\Downloads\prod-snapshot-20260621T120000Z.sql.gz" `
#       -Confirm RESTORE
##############################################################################

param(
    [Parameter(Mandatory = $true)]
    [string]$SnapshotPath,
    [Parameter(Mandatory = $true)]
    [string]$Confirm
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($Confirm.Trim().ToUpper() -ne "RESTORE") {
    throw "Safety check: pass -Confirm RESTORE exactly"
}

$snapshot = Resolve-Path $SnapshotPath
$postRestore = Join-Path $PSScriptRoot "..\..\supabase\post-restore-public-schema.sql"

$pgBin = "C:\Program Files\PostgreSQL\17\bin"
if (Test-Path $pgBin) { $env:PATH = "$pgBin;$env:PATH" }

function Read-RecoveryEnv {
    $path = Join-Path $PSScriptRoot "..\..\env.recovery.local"
    if (-not (Test-Path $path)) { throw "Missing env.recovery.local" }
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
$env:PGPASSWORD = $pass
$env:PGSSLMODE = "require"

Write-Host "=== Restore public snapshot ===" -ForegroundColor Red
Write-Host "  Project:  $ref"
Write-Host "  Snapshot: $snapshot"
Write-Host ""

& psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password `
    --command="DROP SCHEMA IF EXISTS public CASCADE;" --no-psqlrc --set=ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "DROP SCHEMA failed" }

$tempSql = Join-Path $env:TEMP "nurselinks-snap-$([guid]::NewGuid().Guid).sql"
if ($snapshot.Path.EndsWith(".gz")) {
    if (-not (Get-Command gzip -ErrorAction SilentlyContinue)) {
        throw "Need gzip to decompress .sql.gz (Git for Windows)"
    }
    cmd /c "gzip -dc `"$snapshot`" > `"$tempSql`""
} else {
    Copy-Item $snapshot $tempSql
}

(Get-Content $tempSql -Raw) `
    -replace '(?m)^\\restrict .*\r?\n', '' `
    -replace '(?m)^\\unrestrict .*\r?\n', '' |
    Set-Content -Path $tempSql -Encoding utf8

& psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password `
    --file=$tempSql --no-psqlrc --set=ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw "Snapshot restore failed" }
Remove-Item -Force $tempSql -ErrorAction SilentlyContinue

if (Test-Path $postRestore) {
    & psql -h (Db-Host $ref) -p 5432 -U postgres -d postgres --no-password `
        --file=$postRestore --no-psqlrc --set=ON_ERROR_STOP=1
    if ($LASTEXITCODE -ne 0) { throw "post-restore-public-schema.sql failed" }
}

Write-Host "Public snapshot restored. auth.users unchanged; missing profiles backfilled." -ForegroundColor Green
