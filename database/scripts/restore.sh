#!/bin/bash
# AASTool Database — Restore Script
# Restores a database from a SQL dump.
#
# Usage:  bash scripts/restore.sh <backup-file>
# Example: bash scripts/restore.sh backups/aastool-db-20260701_120000.sql.gz

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 backups/aastool-db-20260701_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Determine connection
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
fi

USER=$(echo "$DATABASE_URL" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
PASS=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@\([^/:]*\).*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB=$(echo "$DATABASE_URL" | sed -n 's|mysql://.*/\(.*\)|\1|p')

echo "WARNING: This will REPLACE all data in $DB on $HOST:$PORT"
read -p "Are you sure? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring $BACKUP_FILE to $DB on $HOST:$PORT..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | mysql -h "$HOST" -P "${PORT:-3306}" -u "$USER" -p"$PASS" "$DB"
else
  mysql -h "$HOST" -P "${PORT:-3306}" -u "$USER" -p"$PASS" "$DB" < "$BACKUP_FILE"
fi

echo "Restore complete."
