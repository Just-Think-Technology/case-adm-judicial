#!/bin/sh
# Daily compressed pg_dump with retention. Runs as the database owner (backup
# needs read access to every table) — never the least-privilege app role.
# Off-instance copy is the operator's deploy step (see the Lightsail runbook):
# a dump kept on this machine alone is not a backup.
set -eu

: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
export PGPASSWORD="$POSTGRES_PASSWORD"

BACKUP_DIR=/backups
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

dump_once() {
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  tmp="$BACKUP_DIR/case-adm-$stamp.dump.tmp"
  final="$BACKUP_DIR/case-adm-$stamp.dump.gz"
  pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 9 -f "$tmp"
  gzip -c "$tmp" > "$final"
  rm -f "$tmp"
  sha256sum "$final" > "$final.sha256"
  echo "backup ok: $final"
  # Retention: keep the newest $RETENTION_DAYS dumps, prune the rest.
  # (ls -tr: oldest first. Filenames are generated, never contain spaces.)
  dump_count=$(ls -1 "$BACKUP_DIR"/case-adm-*.dump.gz 2>/dev/null | wc -l)
  if [ "$dump_count" -gt "$RETENTION_DAYS" ]; then
    ls -tr "$BACKUP_DIR"/case-adm-*.dump.gz \
      | head -n "$((dump_count - RETENTION_DAYS))" \
      | while IFS= read -r old; do rm -f "$old" "$old.sha256"; done
  fi
}

# First dump shortly after boot (proves the pipeline on every deploy), then
# daily. Busybox date has no --date math, so sleep in fixed 24h windows.
dump_once
while true; do
  sleep 86400
  dump_once
done
