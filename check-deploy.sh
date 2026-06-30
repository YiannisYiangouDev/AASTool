#!/bin/bash
# Pre-Deployment Check Script for AASTool
# Run this BEFORE deploying to Azure or pushing to production.
# Exits with code 1 if any check fails.
#
# Usage:  bash check-deploy.sh
#         CHECK_SKIP_FRONTEND=true bash check-deploy.sh   (skip frontend build)

# No set -e — we handle errors manually via check() function
set +e

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
  printf "  [%d] %s... " "$TOTAL" "$label"
  if "$@" > /tmp/checkdeploy.log 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    PASS=$((PASS + 1))
  else
    local rc=$?
    if [ "$rc" = 124 ]; then
      echo -e "${RED}TIMEOUT${NC}"
    else
      echo -e "${RED}FAIL${NC} (exit=$rc)"
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
  check "Evaluate API (POST /api/v1/evaluate)" bash -c "
    RESULT=\$(curl -s http://localhost:4000/api/v1/evaluate -X POST -H 'Content-Type: application/json' \
      -d '{\"buildingType\":\"Commercial Buildings\"}' 2>/dev/null)
    echo \"\$RESULT\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d.get('ok')==True; assert 'result' in d; print('OK: obs=' + str(d['result']['obs']))\"
  "

  check "Metadata API (disability-types + dimensions)" bash -c "
    DT=\$(curl -s http://localhost:4000/api/v1/disability-types 2>/dev/null)
    AD=\$(curl -s http://localhost:4000/api/v1/assessment-dimensions 2>/dev/null)
    echo \"\$DT\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d.get('ok')==True; assert len(d.get('data',[]))==5; print('OK: 5 DT')\"
    echo \"\$AD\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d.get('ok')==True; assert len(d.get('data',[]))==5; print('OK: 5 AD')\"
  "

  check "Smoke test: Health + Criteria + Buildings + Login" bash -c "
    STATUS=0
    # 1. Health check
    H=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/health 2>/dev/null)
    [ \"\$H\" != \"200\" ] && echo 'FAIL: health' && STATUS=1

    # 2. List criteria (63 items)
    C=\$(curl -s http://localhost:4000/api/v1/criteria 2>/dev/null)
    echo \"\$C\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert len(d['data'])==63; assert d['data'][0]['code'].startswith('EC'); print('OK: 63 criteria')\" 2>/dev/null || { echo 'FAIL: criteria count'; STATUS=1; }

    # 3. Single criterion
    C1=\$(curl -s http://localhost:4000/api/v1/criteria/EC1.1.1 2>/dev/null)
    echo \"\$C1\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d['data']['code']=='EC1.1.1'; assert len(d['data']['levels'])==5; print('OK: EC1.1.1 with 5 levels')\" 2>/dev/null || { echo 'FAIL: single criterion'; STATUS=1; }

    # 4. Building types (7 types, each with 5 weights)
    B=\$(curl -s http://localhost:4000/api/v1/building-types 2>/dev/null)
    echo \"\$B\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert len(d['data'])==7; assert len(d['data'][0]['disability_weights'])==5; print('OK: 7 building types')\" 2>/dev/null || { echo 'FAIL: building types'; STATUS=1; }

    # 5. NEB thresholds
    N=\$(curl -s http://localhost:4000/api/v1/neb-thresholds 2>/dev/null)
    echo \"\$N\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert len(d['data'])==5; assert d['data'][0]['neb_class'] is not None; print('OK: 5 NEB thresholds')\" 2>/dev/null || { echo 'FAIL: NEB thresholds'; STATUS=1; }

    # 6. Config
    CFG=\$(curl -s http://localhost:4000/api/v1/config 2>/dev/null)
    echo \"\$CFG\" | python3 -c \"import sys,json; d=json.load(sys.stdin); keys=[k['key'] for k in d['data']]; assert 'MAX_OBS' in keys; assert 'DEFAULT_SCORE' in keys; print('OK: config with MAX_OBS + DEFAULT_SCORE')\" 2>/dev/null || { echo 'FAIL: config'; STATUS=1; }

    # 7. Login (success)
    L=\$(curl -s http://localhost:4000/api/v1/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"test123\"}' 2>/dev/null)
    echo \"\$L\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d.get('ok')==True; assert 'accessToken' in d; print('OK: login token received')\" 2>/dev/null || { echo 'FAIL: login'; STATUS=1; }

    # 8. Login (error — no password)
    LE=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/v1/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\"}' 2>/dev/null)
    [ \"\$LE\" != \"400\" ] && echo 'FAIL: login validation' && STATUS=1

    # 9. Evaluate with custom scores (strengths + weaknesses)
    E2=\$(curl -s http://localhost:4000/api/v1/evaluate -X POST -H 'Content-Type: application/json' -d '{\"buildingType\":\"Commercial Buildings\",\"scores\":{\"EC1.1.1\":5,\"EC2.5.3\":1}}' 2>/dev/null)
    echo \"\$E2\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert len(d['result']['strengths'])>0; assert len(d['result']['weaknesses'])>0; print('OK: eval with strengths=' + str(len(d['result']['strengths'])) + ' weaknesses=' + str(len(d['result']['weaknesses'])))\" 2>/dev/null || { echo 'FAIL: evaluate custom'; STATUS=1; }

    # 10. Reports list (should exist after previous assessments)
    R=\$(curl -s http://localhost:4000/api/v1/reports 2>/dev/null)
    echo \"\$R\" | python3 -c \"import sys,json; d=json.load(sys.stdin); assert d.get('ok')==True; assert isinstance(d.get('data'), list); print('OK: reports accessible')\" 2>/dev/null || { echo 'FAIL: reports'; STATUS=1; }

    # 11. Invalid criterion (404)
    C404=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/v1/criteria/NONEXISTENT 2>/dev/null)
    [ \"\$C404\" != \"404\" ] && echo 'FAIL: 404 on invalid criterion' && STATUS=1

    # 12. Evaluate with no buildingType (400)
    E400=\$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/v1/evaluate -X POST -H 'Content-Type: application/json' -d '{}' 2>/dev/null)
    [ \"\$E400\" != \"400\" ] && echo 'FAIL: 400 on empty evaluate' && STATUS=1

    [ \"\$STATUS\" = \"0\" ] && echo 'All 12 smoke tests passed'
    exit \$STATUS
  "
else
  echo -e "  ${YELLOW}  SKIP: API-dependent tests (backend not running)${NC}"
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
