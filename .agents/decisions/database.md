# Database

- **Status:** Accepted — inherited from the previous project
- **Engine:** PostgreSQL, single instance in the compose stack

## Rules

- **Least-privilege role:** the application connects as a dedicated
  non-privileged role (never a superuser / owner / `postgres`).
- **Grants:** only the DML the application needs (`SELECT, INSERT, UPDATE,
  DELETE`) on the application schema, `USAGE` on sequences, and **no `CREATE`**
  on schema or database.
- **Migrations** (`prisma migrate deploy`, schema in
  `backend/prisma/schema.prisma`) run at deploy time with a separate
  **privileged** connection (`DIRECT_URL`/`MIGRATION_DATABASE_URL`), never with
  the application role.
- Default privileges cover tables/sequences created by future migrations, so a
  new table does not silently need a manual grant.
- `postgres` is **internal to the compose network** — never published to the
  host, never reachable from the internet.
- Backups and restore: [../security/backups.md](../security/backups.md).

## How the roles are provisioned

- The application role is fixed as **`case_adm_app`**, created by
  `deploy/postgres-init/01-app-role.sh` on first database initialization with
  the grants above plus `ALTER DEFAULT PRIVILEGES` for the owner, so tables
  made by future migrations inherit them.
- Its password comes from **`POSTGRES_APP_PASSWORD`** — a dev default in the
  compose files, a required secret with no default in production. A missing
  value fails the entrypoint loudly instead of creating an empty-password role.
- The backend runtime reads **`DATABASE_URL`** (app role); migrations read
  **`DIRECT_URL`** (owner). Production secrets must embed those two different
  users — pointing `DATABASE_URL` at a superuser silently disables the whole
  arrangement.
- CI mirrors production: the ephemeral postgres gets the same role and grants,
  migrations run as the owner, and the E2E suite boots the app as
  `case_adm_app` — so a missing grant breaks the build, not the deploy.

## Data rules

- **Cascade is explicit, never implicit:** deleting a case or a client removes
  its documents (see [document storage](document-storage.md)); deleting a user
  removes their profile picture. Nothing is soft-deleted.
- **`content_hash` is UNIQUE** — the database enforces the content identity
  rule; the application must translate the unique-violation into a friendly
  PT-BR message ("this file was already sent"), never a 500.
- Status and visibility are **constrained at the application layer** to the
  closed sets in [document status](document-status.md) and
  [document visibility](document-visibility.md); the database may back them
  with an enum or a check constraint — one definition, not two that can drift.
- Dates are stored as `date`/`timestamptz` and displayed as `dd/mm/aaaa`.
  Times that represent a judicial deadline are stored in the case timezone
  (America/Cuiaba) and never as a formatted string.
- Index the columns you filter by: `case_id`, `status`, `sender_id`, and the
  visibility filter used in the guest list.
- PII columns (name, e-mail, ip_address) are **never written to application
  logs** ([personal data](../security/personal-data-and-secrecy.md)).

## Migration discipline

- **Migration SQL is versioned in git** (`backend/prisma/migrations/`, never
  ignored): `prisma migrate deploy` runs from the repository in CI and in the
  production image, so a migration that is not committed is a migration that is
  never applied.
- Every migration is reviewed as generated SQL before being applied; a
  migration that drops or rewrites data is a **large change** and needs an
  announced plan (see [Task flow](../../AGENTS.md#task-flow)).
- Migrations are forward-only in production: a destructive change ships as
  expand → migrate → contract, never as a single destructive step.
