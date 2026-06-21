#!/usr/bin/env python3
"""Reconcile backup_logs with storage files and GitHub run timings."""
from __future__ import annotations

import gzip
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

ENVIRONMENT = os.environ.get("SYNC_ENV", "").strip()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SERVICE_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
GITHUB_REPOSITORY = os.environ.get("GITHUB_REPOSITORY", "").strip()
LOCAL_BACKUP_FILE = os.environ.get("LOCAL_BACKUP_FILE", "").strip()

if not ENVIRONMENT or ENVIRONMENT not in ("dev", "prod"):
    sys.exit("SYNC_ENV must be dev or prod")
if not SUPABASE_URL or not SERVICE_KEY:
    sys.exit("SUPABASE_URL and SERVICE_KEY are required")

PREFIX = f"{ENVIRONMENT}/"
TIMESTAMP_RE = re.compile(r"-(\d{8}T\d{6}Z)\.sql\.gz$")
RUN_ID_RE = re.compile(r"/actions/runs/(\d+)")

HEADERS = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
}


def request(method: str, url: str, payload=None, extra_headers=None):
    data = None
    headers = dict(HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
            if not body:
                return resp.status, None
            return resp.status, json.loads(body.decode("utf-8"))
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise SystemExit(f"{method} {url} failed ({err.code}): {body}") from err


def parse_file_timestamp(path: str) -> datetime | None:
    match = TIMESTAMP_RE.search(path)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def list_storage_objects() -> dict[str, dict]:
    objects: dict[str, dict] = {}
    offset = 0
    while True:
        _, batch = request(
            "POST",
            f"{SUPABASE_URL}/storage/v1/object/list/backups",
            {
                "prefix": PREFIX,
                "limit": 100,
                "offset": offset,
                "sortBy": {"column": "created_at", "order": "asc"},
            },
        )
        batch = batch or []
        if not batch:
            break
        for obj in batch:
            name = obj.get("name") or ""
            if not name.endswith(".sql.gz"):
                continue
            path = f"{PREFIX}{name}"
            size = obj.get("metadata", {}).get("size") or obj.get("size")
            if size is None:
                size = 0
            objects[path] = {
                "path": path,
                "name": name,
                "size": int(size),
                "created_at": obj.get("created_at") or obj.get("updated_at"),
            }
        if len(batch) < 100:
            break
        offset += len(batch)
    return objects


def list_backup_logs() -> list[dict]:
    _, rows = request(
        "GET",
        f"{SUPABASE_URL}/rest/v1/backup_logs"
        f"?environment=eq.{ENVIRONMENT}"
        f"&select=*"
        f"&order=started_at.desc"
        f"&limit=200",
    )
    return rows or []


def is_restore_row(row: dict) -> bool:
    if row.get("operation") == "restore":
        return True
    msg = row.get("error_message") or ""
    return msg.startswith("RESTORE from:")


def download_storage_file(path: str) -> str | None:
    url = f"{SUPABASE_URL}/storage/v1/object/backups/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
    except urllib.error.HTTPError:
        return None
    import tempfile

    tmp = tempfile.NamedTemporaryFile(suffix=".sql.gz", delete=False)
    tmp.write(data)
    tmp.close()
    return tmp.name


def count_tables(path: str) -> int | None:
    temp_path = None
    if LOCAL_BACKUP_FILE and os.path.basename(LOCAL_BACKUP_FILE) == os.path.basename(path):
        target = LOCAL_BACKUP_FILE
    else:
        temp_path = download_storage_file(path)
        target = temp_path
    if not target:
        return None
    try:
        with gzip.open(target, "rb") as handle:
            return sum(1 for line in handle if line.startswith(b"CREATE TABLE "))
    except OSError:
        return None
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


def fetch_github_run_times(run_url: str) -> tuple[str | None, str | None]:
    if not GITHUB_TOKEN or not GITHUB_REPOSITORY:
        return None, None
    match = RUN_ID_RE.search(run_url)
    if not match:
        return None, None
    run_id = match.group(1)
    api_url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/actions/runs/{run_id}"
    req = urllib.request.Request(
        api_url,
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None, None
    started = data.get("run_started_at") or data.get("created_at")
    completed = data.get("updated_at")
    return started, completed


def needs_github_time_backfill(row: dict) -> bool:
    run_url = row.get("github_run_url") or ""
    if not run_url:
        return False
    started = row.get("started_at")
    completed = row.get("completed_at")
    if not completed:
        return True
    if not started:
        return True
    started_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
    completed_dt = datetime.fromisoformat(completed.replace("Z", "+00:00"))
    if started_dt >= completed_dt:
        return True
    return (completed_dt - started_dt).total_seconds() < 10


def apply_github_run_times(row: dict, updates: dict) -> None:
    run_url = row.get("github_run_url") or ""
    if not needs_github_time_backfill(row):
        return
    gh_started, gh_completed = fetch_github_run_times(run_url)
    if gh_started:
        updates["started_at"] = gh_started
    if gh_completed:
        updates["completed_at"] = gh_completed


def patch_log(log_id: str, payload: dict):
    request("PATCH", f"{SUPABASE_URL}/rest/v1/backup_logs?id=eq.{log_id}", payload)


def insert_log(payload: dict):
    request(
        "POST",
        f"{SUPABASE_URL}/rest/v1/backup_logs",
        payload,
        {"Prefer": "return=minimal"},
    )


def main():
    storage = list_storage_objects()
    logs = list_backup_logs()
    logs_by_path: dict[str, list[dict]] = {}
    for row in logs:
        path = row.get("file_path")
        if path:
            logs_by_path.setdefault(path, []).append(row)

    fixed = 0

    # Ensure every storage file has a completed backup row with size metadata.
    for path, obj in storage.items():
        size = obj["size"]
        if size < 500:
            continue
        ts = parse_file_timestamp(path)
        started_at = iso(ts) if ts else iso(datetime.now(timezone.utc))
        matches = logs_by_path.get(path, [])
        backup_rows = [r for r in matches if not is_restore_row(r)]
        if backup_rows:
            for row in backup_rows:
                updates = {}
                if row.get("status") == "running":
                    updates["status"] = "completed"
                if not row.get("file_size_bytes"):
                    updates["file_size_bytes"] = size
                if not row.get("tables_dumped"):
                    tables = count_tables(path)
                    if tables is not None:
                        updates["tables_dumped"] = tables
                if row.get("status") != "failed" and not row.get("completed_at"):
                    updates["completed_at"] = started_at
                if updates:
                    patch_log(row["id"], updates)
                    fixed += 1
        else:
            insert_log(
                {
                    "backup_type": "snapshot",
                    "operation": "backup",
                    "environment": ENVIRONMENT,
                    "status": "completed",
                    "triggered_by": "manual",
                    "started_at": started_at,
                    "completed_at": started_at,
                    "file_path": path,
                    "file_size_bytes": size,
                }
            )
            fixed += 1

    # Refresh logs after inserts.
    logs = list_backup_logs()

    for row in logs:
        row_id = row["id"]
        path = row.get("file_path")
        updates = {}

        if is_restore_row(row):
            if path and path in storage:
                if not row.get("file_size_bytes"):
                    updates["file_size_bytes"] = storage[path]["size"]
                if not row.get("tables_dumped"):
                    tables = count_tables(path)
                    if tables is not None:
                        updates["tables_dumped"] = tables
            apply_github_run_times(row, updates)
            if updates:
                patch_log(row_id, updates)
                fixed += 1
            continue

        if row.get("status") == "completed" and not is_restore_row(row):
            apply_github_run_times(row, updates)
            if updates:
                patch_log(row_id, updates)
                fixed += 1
            continue

        if row.get("status") != "running":
            continue

        if path and path in storage and storage[path]["size"] >= 500:
            updates = {
                "status": "completed",
                "file_size_bytes": storage[path]["size"],
            }
            if not row.get("completed_at"):
                ts = parse_file_timestamp(path)
                updates["completed_at"] = iso(ts) if ts else iso(datetime.now(timezone.utc))
            patch_log(row_id, updates)
            fixed += 1
            continue

        started_raw = row.get("started_at")
        if not started_raw:
            continue
        started_dt = datetime.fromisoformat(started_raw.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) - started_dt < timedelta(minutes=10):
            continue
        patch_log(
            row_id,
            {
                "status": "failed",
                "completed_at": iso(datetime.now(timezone.utc)),
                "error_message": "Backup did not complete — reconciled by metadata sync.",
            },
        )
        fixed += 1

    print(f"backup_logs metadata sync complete ({fixed} update(s)) for {ENVIRONMENT}")


if __name__ == "__main__":
    main()
