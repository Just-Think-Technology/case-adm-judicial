# Backups and Restore

- **Status:** Accepted — `db-backup` service implemented 2026-10-02 in
  `deploy/docker-compose.production.yml` (daily dump + 7-day retention,
  checksum per dump). Off-instance copy remains an operator step in the
  Lightsail runbook — dumps alone on the machine are not a backup.
- **Why it matters here:** the production stack is **one AWS Lightsail
  instance**. A dump kept in the same instance is **not a backup** — it dies
  with the disk.

## What

- **Database:** daily `pg_dump` (compressed) of PostgreSQL, taken inside the
  compose stack by a `db-backup` service on a cron schedule, with
  `BACKUP_RETENTION_DAYS=7`.
- **Objects (case documents):** the SeaweedFS volume must be
  covered by the same window — a database row without its object is a **broken
  restore**
  ([document storage](../decisions/document-storage.md)).
- **Off-instance copy is mandatory.** The dump and the volume snapshot are
  copied to an object store **outside the Lightsail instance** (Lightsail
  Object Storage or an external S3 bucket). Verified by a checksum after copy.
- Backups are **encrypted** and access-restricted: they contain every
  creditor's personal data ([personal data](personal-data-and-secrecy.md)).

## Retention and scheduling

- 7 days of daily dumps.
- The schedule avoids the busiest business hours; a missed run is alerted.

## Restore test

- Restore into a temporary database, validate table and row counts, then drop
  it. **Mandatory after any change in the backup pipeline** and at least once
  per quarter. A restore procedure that was never executed is not a procedure.
- The restore runbook (who restores, in which order, how long it takes) is
  written when the deploy pipeline is created and linked from
  [AGENTS.md](../../AGENTS.md#deploy).

## Never

- Never `pg_restore` or replace a dump over a production database without an
  announced plan and confirmation (see "Never do" 3 and 12 in
  [AGENTS.md](../../AGENTS.md)).
- Never keep the only copy of a dump on the instance it protects.
