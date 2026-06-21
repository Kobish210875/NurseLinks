#!/usr/bin/env bash
# Insert a running row into public.backup_logs via PostgREST.
# Usage: insert-backup-log.sh '<json payload>'
set -euo pipefail

PAYLOAD="${1:?payload required}"
RESP_FILE="$(mktemp)"
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
  rm -f "${RESP_FILE}"
  exit 1
fi

python3 -c "import json,sys; print(json.load(open('${RESP_FILE}'))[0]['id'])"
rm -f "${RESP_FILE}"
