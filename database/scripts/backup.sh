#!/bin/bash
# AASTool Database — Backup Script
# Creates a compressed SQL dump of the AASTool database.
#
# Usage:  bash scripts/backup.sh
#         DATABASE_URL=mysql://user:pass@host:3306/db bash scripts/backup.sh

set -e

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

# Determine connection
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
fi

USER=$(echo "$DATABASE_URL" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
PASS=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@\([^/:]*\).*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB=$(echo "$DATABASE_URL" | sed -n 's|mysql://.*/\(.*\)|\1|p')

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aastool-db-$TIMESTAMP.sql.gz"

echo "Backing up $DB from $HOST:$PORT..."
mysqldump -h "$HOST" -P "${PORT:-3306}" -u "$USER" -p"$PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  "$DB" | gzip > "$BACKUP_FILE"

echo "Backup saved: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Cleanup old backups (older than 7 days)
find "$BACKUP_DIR" -name 'aastool-db-*.sql.gz' -mtime +7 -delete
echo "Old backups cleaned (retention: 7 days)"
