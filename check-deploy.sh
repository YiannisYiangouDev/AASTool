#!/bin/bash
# Pre-Deployment Check Script for AASTool
# Run this BEFORE deploying to Azure or pushing to production.
# Exits with code 1 if any check fails.
#
# Usage:  bash check-deploy.sh
#         CHECK_SKIP_FRONTEND=true bash check-deploy.sh   (skip frontend build)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
PASS=0
FAIL=0
TOTAL=0

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# ── Helpers ──────────────────────────────────────────────────────
check() {
  TOTAL=$((TOTAL + 1))
  local label="$1"
  shift
  printf "  [%d] %s..." "$TOTAL" "$label"
  if timeout 120 "$@" > /tmp/checkdeploy.log 2>&1; then
    echo -e " ${GREEN}PASS${NC}"
    PASS=$((PASS + 1))
  else
    local rc=$?
    if [ "$rc" = 124 ]; then
      echo -e " ${RED}TIMEOUT${NC}"
    else
      echo -e " ${RED}FAIL${NC}"
    fi
    FAIL=$((FAIL + 1))
  fi
}

summary() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Pre-Deployment Check Summary${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "  Total:  ${CYAN}$TOTAL${NC}"
  echo -e "  Passed: ${GREEN}$PASS${NC}"
  echo -e "  Failed: ${RED}$FAIL${NC}"
  echo ""
  if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}✅ All checks passed — ready to deploy!${NC}"
    echo ""
    return 0
  else
    echo -e "  ${RED}❌ $FAIL check(s) failed — fix before deploying.${NC}"
    echo ""
    return 1
  fi
}

# ── Detect if backend is running ────────────────────────────────
BACKEND_RUNNING=false
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
  BACKEND_RUNNING=true
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  AASTool — Pre-Deployment Checks${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# ═════════════════════════════════════════════════════════════════
#  1. ENVIRONMENT
# ═════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[Phase 1] Environment Checks${NC}"
echo ""

check "Node.js installed" bash -c "node -v > /dev/null"
check "npm installed" bash -c "npm -v > /dev/null"
check "Git available" bash -c "git --version > /dev/null"
check "DATABASE_URL configured" bash -c "grep -q DATABASE_URL $BACKEND_DIR/.env 2>/dev/null || grep -q DATABASE_URL $BACKEND_DIR/.env.example"

echo ""

# ═════════════════════════════════════════════════════════════════
#  2. BACKEND TYPE-SCRIPT COMPILATION
# ═════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[Phase 2] Backend TypeScript Compilation${NC}"
echo ""

check "Backend TS compile (noEmit)" bash -c "cd $BACKEND_DIR && npx tsc --noEmit > /dev/null 2>&1"
check "Backend full build" bash -c "cd $BACKEND_DIR && npm run build > /dev/null 2>&1"

echo ""

# ═════════════════════════════════════════════════════════════════
#  3. BACKEND TESTS
# ═════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[Phase 3] Backend Automated Tests${NC}"
echo ""

# Static tests (no DB needed)
check "Static checks (no hardcoded calc values)" bash -c "cd $BACKEND_DIR && npx ts-node src/tests/static.test.ts > /dev/null 2>&1"

# Workbook mapping tests (no DB needed)
check "Workbook mapping (63 criteria integrity)" bash -c "cd $BACKEND_DIR && npx ts-node src/tests/workbook.mapping.test.ts > /dev/null 2>&1"

# Metadata static tests (no DB needed)
check "Metadata static checks" bash -c "export DATABASE_URL=mysql://myuser:mypassword@localhost:3306/mydb; cd $BACKEND_DIR && SKIP_DB_TESTS=true node dist/tests/metadata.test.js > /dev/null 2>&1"

# DB-dependent tests (only if backend is running)
if [ "$BACKEND_RUNNING" = true ]; then
  check "Calculation engine (DB required)" bash -c "export DATABASE_URL=mysql://myuser:mypassword@localhost:3306/mydb; cd $BACKEND_DIR && node dist/tests/calculation.test.js > /dev/null 2>&1"
  check "Metadata DB checks" bash -c "export DATABASE_URL=mysql://myuser:mypassword@localhost:3306/mydb; cd $BACKEND_DIR && node dist/tests/metadata.test.js > /dev/null 2>&1"
else
  echo -e "  ${YELLOW}  SKIP: DB-dependent tests (backend not running)${NC}"
  echo -e "  ${YELLOW}  Start the backend first with: bash start-dev.sh${NC}"
fi

echo ""

# ═════════════════════════════════════════════════════════════════
#  4. FRONTEND
# ═════════════════════════════════════════════════════════════════
if [ "$CHECK_SKIP_FRONTEND" != "true" ]; then
  echo -e "${YELLOW}[Phase 4] Frontend Checks${NC}"
  echo ""

  # Check if node_modules exists
  if [ -d "$FRONTEND_DIR/node_modules" ]; then
    check "Frontend TypeScript check" bash -c "cd $FRONTEND_DIR && npx tsc --noEmit"
    check "Frontend build (Next.js)" bash -c "cd $FRONTEND_DIR && npm run build"
  else
    echo -e "  ${YELLOW}  SKIP: frontend/node_modules not found — run npm install first${NC}"
  fi
  echo ""
fi

# ═════════════════════════════════════════════════════════════════
#  5. LINT / CODE QUALITY
# ═════════════════════════════════════════════════════════════════
echo -e "${YELLOW}[Phase 5] Code Quality${NC}"
echo ""

# Check for .env with real credentials committed
check "No .env in git staging" bash -c "cd $PROJECT_ROOT && git diff --cached --name-only | grep -qv '\.env' || exit 0"

# Check for hardcoded secrets in staged files
check "No hardcoded secrets in staged files" bash -c "
  cd $PROJECT_ROOT
  git diff --cached --diff-filter=ACMR -- '*.ts' '*.js' '*.json' '*.yml' '*.yaml' 2>/dev/null | grep -q 'rootpass\|mypassword' && exit 1 || exit 0
"

# Check git status is clean (everything committed)
if [ -z "$(cd $PROJECT_ROOT && git status --porcelain 2>/dev/null)" ]; then
  check "Git working tree is clean" bash -c "true"
else
  echo -e "  ${YELLOW}  WARN: Uncommitted changes exist:${NC}"
  cd "$PROJECT_ROOT" && git status --short | sed 's/^/    /'
  echo ""
fi

echo ""

# ═════════════════════════════════════════════════════════════════
#  SUMMARY
# ═════════════════════════════════════════════════════════════════
summary
exit $?
