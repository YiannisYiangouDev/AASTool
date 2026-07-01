#!/bin/bash
# AASTool Database — Verification Script
# Validates that the database is running and all tables/data exist.
# Does NOT modify any data.
#
# Usage:  bash verify-database.sh
#         DATABASE_URL=mysql://user:pass@host:3306/db bash verify-database.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0

# Determine connection
if [ -n "$DATABASE_URL" ]; then
  CONN="$DATABASE_URL"
else
  # Try local Docker defaults
  CONN="mysql://myuser:mypassword@127.0.0.1:3306/mydb"
fi

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}  AASTool Database Verification${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo ""

# ── Extract parts from DATABASE_URL ────────────────────────────
USER=$(echo "$CONN" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
PASS=$(echo "$CONN" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
HOST=$(echo "$CONN" | sed -n 's|mysql://[^@]*@\([^/:]*\).*|\1|p')
PORT=$(echo "$CONN" | sed -n 's|mysql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB=$(echo "$CONN" | sed -n 's|mysql://.*/\(.*\)|\1|p')
PORT=${PORT:-3306}

MYSQL_CMD="mysql -h $HOST -P $PORT -u $USER -p$PASS $DB -e"

check_table() {
  local table=$1
  local expected=$2
  local count=$($MYSQL_CMD "SELECT COUNT(*) as c FROM $table" 2>/dev/null | tail -1)
  if [ -n "$count" ] && [ "$count" -ge "${expected:-0}" ]; then
    echo -e "  ${GREEN}✓${NC} $table ($count rows)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $table (expected ≥${expected:-0}, got $count)"
    FAIL=$((FAIL + 1))
  fi
}

check_connection() {
  if $MYSQL_CMD "SELECT 1" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Database connection successful ($HOST:$PORT/$DB)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} Cannot connect to $HOST:$PORT/$DB"
    FAIL=$((FAIL + 1))
    echo ""
    echo -e "  ${YELLOW}Hint: Start the database first:${NC}"
    echo "    cd database && docker compose up -d"
    echo ""
    exit 1
  fi
}

echo -e "${YELLOW}[Connection]${NC}"
check_connection
echo ""

echo -e "${YELLOW}[Tables & Data]${NC}"
check_table "criteria" 63
check_table "building_types" 7
check_table "neb_thresholds" 5
check_table "config" 5
check_table "disability_types" 5
check_table "assessment_dimensions" 5
echo ""

echo -e "${YELLOW}[Foreign Keys & Indexes]${NC}"
FK_COUNT=$($MYSQL_CMD "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_TYPE='FOREIGN KEY' AND TABLE_SCHEMA='$DB'" 2>/dev/null | tail -1)
echo -e "  ${GREEN}✓${NC} Foreign keys: $FK_COUNT"

IDX_COUNT=$($MYSQL_CMD "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='$DB'" 2>/dev/null | tail -1)
echo -e "  ${GREEN}✓${NC} Indexes: $IDX_COUNT"
echo ""

echo -e "${YELLOW}[Schema Integrity]${NC}"
# Verify specific required columns
$MYSQL_CMD "SELECT 'criteria.code' FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='criteria' AND COLUMN_NAME='code'" 2>/dev/null | tail -1 | grep -q 'criteria.code' && echo -e "  ${GREEN}✓${NC} criteria.code exists" || echo -e "  ${RED}✗${NC} criteria.code MISSING"
$MYSQL_CMD "SELECT 'evaluations.result' FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='evaluations' AND COLUMN_NAME='result'" 2>/dev/null | tail -1 | grep -q 'evaluations.result' && echo -e "  ${GREEN}✓${NC} evaluations.result exists" || echo -e "  ${RED}✗${NC} evaluations.result MISSING"
echo ""

# ── Summary ────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo -e "  Total checks: $TOTAL"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}✅ Database verification passed — all data intact.${NC}"
else
  echo -e "  ${RED}❌ $FAIL check(s) failed — review above.${NC}"
fi
echo ""

exit $FAIL
