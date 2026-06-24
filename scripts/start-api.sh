#!/bin/bash
# Start the AAS backend API only (no frontend, no DB setup).
# Assumes MariaDB/MySQL is already running on localhost:3306.
# Usage: ./scripts/start-api.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AAS — Start API Only${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check .env
echo -e "${YELLOW}Step 1: Checking environment...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo -e "  ${BLUE}ℹ${NC} No .env found — copying from .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi
export $(grep -v '^#' "$BACKEND_DIR/.env" | tr -d '\r' | xargs)
echo -e "  ${GREEN}✓${NC} Environment ready"
echo ""

# Step 2: Build if needed
echo -e "${YELLOW}Step 2: Checking build...${NC}"
if [ ! -f "$BACKEND_DIR/dist/index.js" ]; then
  echo -e "  ${BLUE}ℹ${NC} Building TypeScript..."
  cd "$BACKEND_DIR"
  npm install --silent 2>&1 | tail -1
  npm run build 2>&1 | tail -1
  echo -e "  ${GREEN}✓${NC} Build complete"
else
  echo -e "  ${GREEN}✓${NC} Already built"
fi
echo ""

# Step 3: Start API
echo -e "${YELLOW}Step 3: Starting API...${NC}"

# Kill any stale process on port 4000
lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

export DATABASE_URL="${DATABASE_URL:-mysql://myuser:mypassword@127.0.0.1:3306/mydb}"

echo -e "  ${BLUE}ℹ${NC} Starting backend on http://localhost:4000 ..."
cd "$BACKEND_DIR"
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid

# Wait for it to be ready
for i in {1..15}; do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API running on http://localhost:4000"
    echo -e "  ${GREEN}✓${NC} Health check: http://localhost:4000/health"
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  API is ready!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Stop: ${YELLOW}kill $BACKEND_PID${NC} or ${YELLOW}./scripts/stop-dev.sh${NC}"
    exit 0
  fi
  sleep 1
done

echo -e "  ${RED}✗${NC} API failed to start. Check /tmp/backend.log"
cat /tmp/backend.log
exit 1
