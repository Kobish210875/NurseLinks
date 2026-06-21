#!/usr/bin/env bash
# GitHub-hosted runners often cannot reach Supabase over IPv6.
# Write libpq env vars to a file later steps can source.
set -euo pipefail

PG_ENV_FILE="/tmp/pg-connection.env"

if [ -z "${DB_URL:-}" ] || [ -z "${SUPABASE_URL:-}" ]; then
  echo "DB_URL and SUPABASE_URL must be set."
  exit 1
fi

python3 - <<'PY'
import os
import shlex
import subprocess
from urllib.parse import urlparse, unquote

db_url = os.environ["DB_URL"]
supabase_url = os.environ["SUPABASE_URL"]
env_file = "/tmp/pg-connection.env"

parsed = urlparse(db_url)
user = parsed.username or "postgres"
database = (parsed.path or "/postgres").lstrip("/") or "postgres"
port = parsed.port or 5432
password = unquote(parsed.password or "")

if not password:
    raise SystemExit("DB_URL is missing a password.")

project_ref = supabase_url.removeprefix("https://").split(".supabase.co", 1)[0]
db_host = f"db.{project_ref}.supabase.co"

result = subprocess.run(
    ["getent", "ahostsv4", db_host],
    check=True,
    capture_output=True,
    text=True,
)
hostaddr = result.stdout.strip().split()[0]
if not hostaddr:
    raise SystemExit(f"Could not resolve IPv4 address for {db_host}")

lines = [
    f"export PGHOST={shlex.quote(db_host)}",
    f"export PGHOSTADDR={shlex.quote(hostaddr)}",
    f"export PGPORT={shlex.quote(str(port))}",
    f"export PGUSER={shlex.quote(user)}",
    f"export PGDATABASE={shlex.quote(database)}",
    "export PGSSLMODE=require",
    f"export PGPASSWORD={shlex.quote(password)}",
]

with open(env_file, "w", encoding="utf-8") as handle:
    handle.write("\n".join(lines) + "\n")

print(f"PostgreSQL target: {user}@{db_host} ({hostaddr}):{port}/{database}")
PY
