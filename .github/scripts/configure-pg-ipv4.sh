#!/usr/bin/env bash
# GitHub-hosted runners often cannot reach Supabase over IPv6.
# Resolve the direct DB host to IPv4 and export libpq env vars.
set -euo pipefail

if [ -z "${DB_URL:-}" ] || [ -z "${SUPABASE_URL:-}" ]; then
  echo "DB_URL and SUPABASE_URL must be set."
  exit 1
fi

if [ -z "${GITHUB_ENV:-}" ]; then
  echo "GITHUB_ENV is not set."
  exit 1
fi

python3 - <<'PY'
import os
import subprocess
from urllib.parse import urlparse, unquote

db_url = os.environ["DB_URL"]
supabase_url = os.environ["SUPABASE_URL"]
github_env = os.environ["GITHUB_ENV"]

parsed = urlparse(db_url)
user = parsed.username or "postgres"
database = (parsed.path or "/postgres").lstrip("/") or "postgres"
port = parsed.port or 5432
password = unquote(parsed.password or "")

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

with open(github_env, "a", encoding="utf-8") as env_file:
    env_file.write(f"PGHOST={db_host}\n")
    env_file.write(f"PGHOSTADDR={hostaddr}\n")
    env_file.write(f"PGPORT={port}\n")
    env_file.write(f"PGUSER={user}\n")
    env_file.write(f"PGDATABASE={database}\n")
    env_file.write("PGSSLMODE=require\n")
    env_file.write("PGPASSWORD<<EOF\n")
    env_file.write(password + "\n")
    env_file.write("EOF\n")

print(f"PostgreSQL target: {user}@{db_host} ({hostaddr}):{port}/{database}")
PY
