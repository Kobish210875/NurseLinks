#!/usr/bin/env bash
# Insert a running row into public.backup_logs via PostgREST.
# Usage: insert-backup-log.sh '<json payload>'
set -euo pipefail

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SERVICE_KEY:-}" ]; then
  echo "insert-backup-log.sh: SUPABASE_URL and SERVICE_KEY must be set" >&2
  exit 1
fi

PAYLOAD="${1:?payload required}"
RESP_FILE="$(mktemp)"
trap 'rm -f "${RESP_FILE}"' EXIT

HTTP_CODE="$(curl -sS -o "${RESP_FILE}" -w "%{http_code}" -X POST \
  "${SUPABASE_URL}/rest/v1/backup_logs" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "${PAYLOAD}")"

if [ "${HTTP_CODE}" -lt 200 ] || [ "${HTTP_CODE}" -ge 300 ]; then
  echo "backup_logs insert failed (HTTP ${HTTP_CODE}):"
  cat "${RESP_FILE}"
  exit 1
fi

python3 - <<'PY' "${RESP_FILE}"
import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as handle:
    data = json.load(handle)

row = data[0] if isinstance(data, list) else data
log_id = row.get("id")
if not log_id:
    print("backup_logs insert response missing id:", data, file=sys.stderr)
    sys.exit(1)

print(log_id)
PY
