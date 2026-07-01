#!/bin/bash
# AASTool Database — Schema Export Script
# Exports the current database schema (no data) to the schema/ directory.
#
# Usage:  bash scripts/export-schema.sh

set -e

SCHEMA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/schema"

if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
fi

USER=$(echo "$DATABASE_URL" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
PASS=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
HOST=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@\([^/:]*\).*|\1|p')
PORT=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB=$(echo "$DATABASE_URL" | sed -n 's|mysql://.*/\(.*\)|\1|p')

echo "Exporting schema from $DB to $SCHEMA_DIR..."
mysqldump -h "$HOST" -P "${PORT:-3306}" -u "$USER" -p"$PASS" \
  --no-data \
  --routines \
  --triggers \
  --events \
  "$DB" > "$SCHEMA_DIR/aastool-schema.sql"

echo "Schema exported: $SCHEMA_DIR/aastool-schema.sql"
echo "Lines: $(wc -l < "$SCHEMA_DIR/aastool-schema.sql")"
