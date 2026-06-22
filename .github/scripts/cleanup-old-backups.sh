#!/usr/bin/env bash
# Delete snapshot files and backup_logs rows older than RETENTION_HOURS.
set -euo pipefail

ENVIRONMENT="${1:-}"
RETENTION_HOURS="${2:-72}"
# Optional: only delete files whose names CONTAIN this string (e.g. "snapshot", "weekly").
# Leave empty to delete all .sql.gz files under the environment prefix.
FILE_PATTERN="${3:-}"

if [ -z "${ENVIRONMENT}" ] || { [ "${ENVIRONMENT}" != "dev" ] && [ "${ENVIRONMENT}" != "prod" ]; }; then
  echo "Usage: cleanup-old-backups.sh <dev|prod> [retention_hours] [file_pattern]"
  exit 1
fi

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SERVICE_KEY:-}" ]; then
  echo "SUPABASE_URL and SERVICE_KEY must be set."
  exit 1
fi

export CLEANUP_ENV="${ENVIRONMENT}"
export RETENTION_HOURS="${RETENTION_HOURS}"
export FILE_PATTERN="${FILE_PATTERN}"

python3 - <<'PY'
import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

environment = os.environ["CLEANUP_ENV"]
retention_hours = int(os.environ["RETENTION_HOURS"])
file_pattern = os.environ.get("FILE_PATTERN", "").strip()
supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
service_key = os.environ["SERVICE_KEY"]
cutoff = datetime.now(timezone.utc) - timedelta(hours=retention_hours)
prefix = f"{environment}/"
timestamp_re = re.compile(r"-(\d{8}T\d{6}Z)\.sql\.gz$")

headers = {
    "Authorization": f"Bearer {service_key}",
    "apikey": service_key,
}


def request(method: str, url: str, payload=None, extra_headers=None):
    data = None
    req_headers = dict(headers)
    if extra_headers:
        req_headers.update(extra_headers)
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, method=method, headers=req_headers)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
            if not body:
                return resp.status, None
            return resp.status, json.loads(body.decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise SystemExit(f"{method} {url} failed ({err.code}): {body}") from err


def parse_timestamp(name: str):
    match = timestamp_re.search(name)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)


def list_objects():
    objects = []
    offset = 0
    while True:
        _, payload = request(
            "POST",
            f"{supabase_url}/storage/v1/object/list/backups",
            {
                "prefix": prefix,
                "limit": 100,
                "offset": offset,
                "sortBy": {"column": "created_at", "order": "asc"},
            },
        )
        batch = payload or []
        if not batch:
            break
        objects.extend(batch)
        if len(batch) < 100:
            break
        offset += len(batch)
    return objects


def delete_storage(paths: list[str]):
    if not paths:
        return
    request(
        "DELETE",
        f"{supabase_url}/storage/v1/object/backups",
        paths,
    )


def delete_logs(cutoff_iso: str):
    request(
        "DELETE",
        f"{supabase_url}/rest/v1/backup_logs?environment=eq.{environment}&started_at=lt.{cutoff_iso}",
    )


objects = list_objects()
to_delete = []
for obj in objects:
    name = obj.get("name") or ""
    if not name.endswith(".sql.gz"):
        continue
    # If a pattern is specified, only delete files whose name contains it.
    if file_pattern and file_pattern not in name:
        continue
    path = f"{prefix}{name}"
    ts = parse_timestamp(name)
    if ts is None:
        created_at = obj.get("created_at") or obj.get("updated_at")
        if created_at:
            ts = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    if ts is None:
        continue
    if ts < cutoff:
        to_delete.append(path)

pattern_label = f" matching '{file_pattern}'" if file_pattern else ""
print(f"Retention: {retention_hours}h (cutoff {cutoff.isoformat()})")
print(f"Found {len(objects)} object(s) under {prefix}{pattern_label}, deleting {len(to_delete)} older file(s).")

delete_storage(to_delete)
cutoff_iso = cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")
delete_logs(cutoff_iso)
print("Cleanup complete.")
PY
