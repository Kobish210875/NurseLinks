#!/usr/bin/env bash
# Connect to Supabase Postgres from GitHub Actions (IPv4-only runners).
#
# db.<ref>.supabase.co is IPv6-only. Use the session pooler host from
# Supabase Dashboard → Connect → Session pooler (port 5432).
#
# Required secrets per environment:
#   SUPABASE_*_URL, SUPABASE_*_SERVICE_ROLE_KEY, SUPABASE_*_DB_PASSWORD
#   SUPABASE_*_DB_POOLER_HOST  (e.g. aws-0-eu-central-1.pooler.supabase.com)
#
# Optional fallback: SUPABASE_*_DB_URL (postgresql:// or postgres:// URI)
set -euo pipefail

if [ -z "${SUPABASE_URL:-}" ]; then
  echo "SUPABASE_URL must be set."
  exit 1
fi

python3 - <<'PY'
import os
import shlex
import socket
import subprocess
from urllib.parse import unquote

db_url = os.environ.get("DB_URL", "").strip()
db_password = os.environ.get("DB_PASSWORD", "").strip()
pooler_host = os.environ.get("DB_POOLER_HOST", "").strip()
supabase_url = os.environ["SUPABASE_URL"]
env_file = "/tmp/pg-connection.env"

user = "postgres"
port = 5432
database = "postgres"
url_password = ""


def parse_db_url(url: str) -> tuple[str, str, int, str, str]:
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            rest = url[len(prefix) :]
            break
    else:
        raise SystemExit(
            "DB_URL must start with postgresql:// or postgres://. "
            "Recommended: set SUPABASE_*_DB_PASSWORD and SUPABASE_*_DB_POOLER_HOST instead."
        )

    if "pooler.supabase.com" in rest:
        at = rest.rfind("@")
        if at == -1:
            raise SystemExit("DB_URL pooler URI must include @pooler.supabase.com")
        user_pass = rest[:at]
        host_path = rest[at + 1 :]
    else:
        marker = "@db."
        idx = rest.find(marker)
        if idx == -1:
            raise SystemExit("DB_URL must contain @db.<project-ref>.supabase.co or a pooler host")
        user_pass = rest[:idx]
        host_path = rest[idx + 1 :]

    if ":" not in user_pass:
        raise SystemExit("DB_URL must include USER:PASSWORD before the host")

    parsed_user, password = user_pass.split(":", 1)
    host_part, _, path_part = host_path.partition("/")
    parsed_database = path_part or "postgres"

    if ":" in host_part:
        parsed_host, port_text = host_part.rsplit(":", 1)
        parsed_port = int(port_text)
    else:
        parsed_host = host_part
        parsed_port = 5432

    return (
        parsed_user or "postgres",
        unquote(password),
        parsed_port,
        parsed_database or "postgres",
        parsed_host,
    )


def resolve_ipv4(host: str) -> str | None:
    try:
        return socket.getaddrinfo(host, 5432, socket.AF_INET, socket.SOCK_STREAM)[0][4][0]
    except OSError:
        pass

    try:
        result = subprocess.run(
            ["getent", "hosts", host],
            check=True,
            capture_output=True,
            text=True,
        )
        for line in result.stdout.splitlines():
            ip = line.split()[0]
            if "." in ip:
                return ip
    except (subprocess.CalledProcessError, IndexError):
        pass

    try:
        result = subprocess.run(
            ["dig", "+short", "A", host],
            check=True,
            capture_output=True,
            text=True,
        )
        for line in result.stdout.splitlines():
            ip = line.strip()
            if ip and "." in ip:
                return ip
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    return None


project_ref = supabase_url.removeprefix("https://").split(".supabase.co", 1)[0]
direct_host = f"db.{project_ref}.supabase.co"
db_host = direct_host

if db_url.startswith(("postgresql://", "postgres://")):
    parsed_user, url_password, port, database, parsed_host = parse_db_url(db_url)
    user = parsed_user
    db_host = parsed_host
    if "pooler.supabase.com" in parsed_host:
        pooler_host = parsed_host

password = db_password or url_password
if not password:
    raise SystemExit(
        "Database password missing. Add GitHub secret SUPABASE_DEV_DB_PASSWORD "
        "(plain text, recommended)."
    )

if pooler_host:
    db_host = pooler_host
    if not user.startswith("postgres."):
        user = f"postgres.{project_ref}"
elif db_host == direct_host and not resolve_ipv4(direct_host):
    raise SystemExit(
        f"{direct_host} has no IPv4 address. GitHub Actions cannot use the direct DB host.\n"
        f"Add GitHub secret SUPABASE_*_DB_POOLER_HOST from Supabase Dashboard → Connect → "
        f"Session pooler (example: aws-0-eu-central-1.pooler.supabase.com)."
    )

hostaddr = resolve_ipv4(db_host)
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

mode = "session pooler" if "pooler.supabase.com" in db_host else "direct"
print(f"PostgreSQL target ({mode}): {user}@{db_host} ({hostaddr}):{port}/{database}")
PY
