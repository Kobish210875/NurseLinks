#!/usr/bin/env bash
# GitHub-hosted runners often cannot reach Supabase over IPv6.
# Write libpq env vars to a file later steps can source.
#
# Required GitHub secrets per environment:
#   SUPABASE_*_URL, SUPABASE_*_SERVICE_ROLE_KEY, SUPABASE_*_DB_PASSWORD
# Optional fallback:
#   SUPABASE_*_DB_URL (postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres)
set -euo pipefail

if [ -z "${SUPABASE_URL:-}" ]; then
  echo "SUPABASE_URL must be set."
  exit 1
fi

python3 - <<'PY'
import os
import shlex
import subprocess
from urllib.parse import unquote

db_url = os.environ.get("DB_URL", "").strip()
db_password = os.environ.get("DB_PASSWORD", "").strip()
supabase_url = os.environ["SUPABASE_URL"]
env_file = "/tmp/pg-connection.env"

user = "postgres"
port = 5432
database = "postgres"
url_password = ""


def parse_db_url(url: str) -> tuple[str, str, int, str]:
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            rest = url[len(prefix) :]
            break
    else:
        raise SystemExit(
            "DB_URL must start with postgresql:// or postgres://. "
            "Recommended: set SUPABASE_*_DB_PASSWORD instead and leave DB_URL unset."
        )

    marker = "@db."
    idx = rest.find(marker)
    if idx == -1:
        raise SystemExit("DB_URL must contain @db.<project-ref>.supabase.co")

    user_pass = rest[:idx]
    host_path = rest[idx + 1 :]

    if ":" not in user_pass:
        raise SystemExit("DB_URL must use postgres:PASSWORD@db....")

    parsed_user, password = user_pass.split(":", 1)
    host_part, _, path_part = host_path.partition("/")
    parsed_database = path_part or "postgres"

    if ":" in host_part:
        _, port_text = host_part.rsplit(":", 1)
        parsed_port = int(port_text)
    else:
        parsed_port = 5432

    return parsed_user or "postgres", unquote(password), parsed_port, parsed_database or "postgres"


if db_url.startswith(("postgresql://", "postgres://")):
    user, url_password, port, database = parse_db_url(db_url)

password = db_password or url_password
if not password:
    raise SystemExit(
        "Database password missing. Add GitHub secret SUPABASE_DEV_DB_PASSWORD "
        "(plain text, recommended) or a full SUPABASE_DEV_DB_URL."
    )

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
