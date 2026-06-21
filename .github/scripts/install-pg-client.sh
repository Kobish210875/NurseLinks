#!/usr/bin/env bash
# Install a PostgreSQL client matching the remote server version (required for pg_dump).
set -euo pipefail

if [ ! -f /tmp/pg-connection.env ]; then
  echo "Missing /tmp/pg-connection.env — run configure-pg-ipv4.sh first."
  exit 1
fi

# shellcheck disable=SC1091
source /tmp/pg-connection.env

if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends postgresql-client
fi

SERVER_VERSION_NUM=$(psql -tAc "SHOW server_version_num;" | tr -d '[:space:]')
SERVER_MAJOR="${SERVER_VERSION_NUM:0:2}"
echo "Remote PostgreSQL version: ${SERVER_VERSION_NUM} (major ${SERVER_MAJOR})"

CLIENT_MAJOR=$(pg_dump --version 2>/dev/null | sed -n 's/.* \([0-9]\+\).*/\1/p' | head -1 || true)
if [ "${CLIENT_MAJOR}" = "${SERVER_MAJOR}" ]; then
  PG_BIN_DIR=$(dirname "$(command -v pg_dump)")
  echo "Client already matches server (pg_dump major ${CLIENT_MAJOR})."
  echo "PG_BIN_DIR=${PG_BIN_DIR}" >> "${GITHUB_ENV}"
  exit 0
fi

echo "Installing postgresql-client-${SERVER_MAJOR} (runner had major ${CLIENT_MAJOR:-unknown})..."
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends wget ca-certificates lsb-release gnupg
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list >/dev/null
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends "postgresql-client-${SERVER_MAJOR}"

PG_BIN_DIR="/usr/lib/postgresql/${SERVER_MAJOR}/bin"
echo "PG_BIN_DIR=${PG_BIN_DIR}" >> "${GITHUB_ENV}"
"${PG_BIN_DIR}/pg_dump" --version
