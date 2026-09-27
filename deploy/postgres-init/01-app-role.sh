#!/bin/sh
# Postgres entrypoint — creates the least-privilege application role.
# Runs only on first initialization (empty data dir), before the backend or
# migrations ever connect, per .agents/decisions/database.md.
# Fails loudly when the password is missing instead of creating a role with an
# empty password.

if [ -z "${POSTGRES_APP_PASSWORD:-}" ]; then
  echo "postgres-init: POSTGRES_APP_PASSWORD is required — the application role must have a password" >&2
  exit 1
fi

# :'var' interpolates as a string literal and :"var" as an identifier, so every
# value stays safe no matter which characters it carries. The heredoc is quoted
# so the shell passes everything through to psql untouched. There is no
# IF NOT EXISTS guard: this script runs exactly once, on an empty database, so
# the role cannot already exist — and psql does not substitute variables inside
# dollar-quoted DO blocks, which is where such a guard would have to live.
psql -v ON_ERROR_STOP=1 \
  -v db_name="$POSTGRES_DB" \
  -v db_owner="$POSTGRES_USER" \
  -v app_password="$POSTGRES_APP_PASSWORD" \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" <<'EOSQL'
CREATE ROLE case_adm_app WITH LOGIN PASSWORD :'app_password';

GRANT CONNECT ON DATABASE :"db_name" TO case_adm_app;
GRANT USAGE ON SCHEMA public TO case_adm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO case_adm_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO case_adm_app;

-- Tables created later by migrations, which run as the owner, inherit the same
-- grants automatically — a new table never needs a manual grant.
ALTER DEFAULT PRIVILEGES FOR ROLE :"db_owner" IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO case_adm_app;
ALTER DEFAULT PRIVILEGES FOR ROLE :"db_owner" IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO case_adm_app;
EOSQL
