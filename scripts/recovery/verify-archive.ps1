##############################################################################
# Verify a local recovery archive before relying on it.
#
#   .\scripts\recovery\verify-archive.ps1 -ArchivePath scripts/recovery/archives/prod-full-...
##############################################################################

param(
    [Parameter(Mandatory = $true)]
    [string]$ArchivePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$archive = Resolve-Path $ArchivePath
$manifestPath = Join-Path $archive "manifest.json"
$publicSql = Join-Path $archive "public-schema.sql"
$publicGz = Join-Path $archive "public-schema.sql.gz"
$authSql = Join-Path $archive "auth-data.sql"
$storageDir = Join-Path $archive "storage"

$ok = $true

function Check([bool]$cond, [string]$msg) {
    if ($cond) { Write-Host "  OK   $msg" -ForegroundColor Green }
    else { Write-Host "  FAIL $msg" -ForegroundColor Red; $script:ok = $false }
}

Write-Host "=== Verify archive ===" -ForegroundColor Cyan
Write-Host "  $archive"
Write-Host ""

Check (Test-Path $manifestPath) "manifest.json exists"
if (Test-Path $manifestPath) {
    $m = Get-Content $manifestPath -Raw | ConvertFrom-Json
    Write-Host "       created: $($m.created_at_utc)  env: $($m.environment)  ref: $($m.project_ref)"
}

$hasPublic = (Test-Path $publicSql) -or (Test-Path $publicGz)
Check $hasPublic "public schema dump present"
if (Test-Path $publicSql) {
    $size = (Get-Item $publicSql).Length
    Check ($size -gt 500) "public-schema.sql size ($size bytes)"
    $tables = (Select-String -Path $publicSql -Pattern '^CREATE TABLE ' -AllMatches).Matches.Count
    Check ($tables -gt 0) "CREATE TABLE count ($tables)"
}
if (Test-Path $authSql) {
    $size = (Get-Item $authSql).Length
    Check ($size -gt 100) "auth-data.sql size ($size bytes)"
    Check ((Select-String -Path $authSql -Pattern 'COPY auth\.users').Count -gt 0) "auth.users COPY block"
}

if (Test-Path $storageDir) {
    $files = Get-ChildItem -Path $storageDir -Recurse -File
    Check ($files.Count -gt 0) "storage files ($($files.Count))"
    $bytes = ($files | Measure-Object -Property Length -Sum).Sum
    Write-Host "       storage total: $bytes bytes"
} else {
    Write-Host "  WARN no storage/ folder (photos/CVs not in this archive)" -ForegroundColor DarkYellow
}

Write-Host ""
if ($ok) {
    Write-Host "Archive looks usable." -ForegroundColor Green
} else {
    Write-Host "Archive has problems - run a fresh backup." -ForegroundColor Red
    exit 1
}
