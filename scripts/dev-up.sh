#!/usr/bin/env bash
# Brings the whole system up with Docker Compose and prints where everything
# answers. Run from anywhere: ./scripts/dev-up.sh [--no-build]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="docker compose --file ${ROOT}/deploy/docker-compose.yml"

BUILD="--build"
if [[ "${1:-}" == "--no-build" ]]; then
  BUILD=""
fi

# shellcheck disable=SC2086
${COMPOSE} up -d ${BUILD}

wait_for() {
  local name="$1" url="$2" tries=0
  until curl -sf -o /dev/null "${url}"; do
    tries=$((tries + 1))
    if [[ "${tries}" -ge 40 ]]; then
      echo "!! ${name} did not answer at ${url} after 40s — check '${COMPOSE} logs ${name}'"
      return 1
    fi
    sleep 3
  done
  echo "ok ${name} -> ${url}"
}

FAILED=0
wait_for "frontend" "http://localhost:3001/" || FAILED=1
wait_for "backend" "http://localhost:3000/health" || FAILED=1
wait_for "seaweedfs" "http://localhost:8333/status" || FAILED=1
wait_for "mailpit" "http://localhost:8025/" || FAILED=1

cat <<'PORTS'

Service ports (localhost):
  portal (frontend)    http://localhost:3001/
  api (backend)        http://localhost:3000/   (health: /health)
  mailpit (e-mail)     http://localhost:8025/   (smtp: :1025)
  seaweedfs s3         http://localhost:8333/   (filer: :9333, master: :19333)
  postgres             localhost:5432
PORTS

if [[ "${FAILED}" -ne 0 ]]; then
  echo "Some services did not answer — see above."
  exit 1
fi
echo "All services up."
