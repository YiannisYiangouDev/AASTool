#!/bin/bash
# Build and start all AAS services in production mode
# Usage: ./build-all.sh
#   Builds TypeScript backend + Next.js frontend, then starts everything.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  [ -f /tmp/backend.pid ] && kill $(cat /tmp/backend.pid) 2>/dev/null && rm /tmp/backend.pid
  [ -f /tmp/frontend.pid ] && kill $(cat /tmp/frontend.pid) 2>/dev/null && rm /tmp/frontend.pid
  echo -e "${GREEN}Done${NC}"
  exit 0
}
trap cleanup EXIT INT TERM

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AAS — Build & Start All${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# ── Step 1: Check prerequisites ─────────────────────────────────
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "  ${RED}Node.js not found${NC}"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo -e "  ${RED}npm not found${NC}"; exit 1; }
echo -e "  ${GREEN}Node.js $(node -v)${NC}"
echo ""

# ── Step 2: Environment ─────────────────────────────────────────
echo -e "${YELLOW}[2/5] Setting up environment...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo -e "  ${YELLOW}No .env found — copying from .env.example${NC}"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
fi
export $(grep -v '^#' "$BACKEND_DIR/.env" | tr -d '\r' | xargs)
DATABASE_URL="${DATABASE_URL:-mysql://myuser:mypassword@127.0.0.1:3306/mydb}"
export DATABASE_URL
echo -e "  ${GREEN}Environment ready${NC}"
echo ""

# ── Step 3: Build Backend ────────────────────────────────────────
echo -e "${YELLOW}[3/5] Building backend (TypeScript)...${NC}"
cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1
npm run build 2>&1 | tail -3
echo -e "  ${GREEN}Backend built${NC}"
echo ""

# ── Step 4: Build Frontend ───────────────────────────────────────
echo -e "${YELLOW}[4/5] Building frontend (Next.js)...${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1
npm run build 2>&1 | tail -5
echo -e "  ${GREEN}Frontend built${NC}"
echo ""

# ── Step 5: Start services ──────────────────────────────────────
echo -e "${YELLOW}[5/5] Starting services...${NC}"

# Kill any stale processes
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 1

# Backend
cd "$BACKEND_DIR"
echo -e "  ${BLUE}Starting backend on :4000...${NC}"
node dist/index.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid

for i in $(seq 1 15); do
  if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}Backend running on http://localhost:4000${NC}"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo -e "  ${RED}Backend failed to start — check /tmp/backend.log${NC}"
  fi
  sleep 1
done

# Frontend
cd "$FRONTEND_DIR"
echo -e "  ${BLUE}Starting frontend on :3000...${NC}"
PORT=3000 npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/frontend.pid

for i in $(seq 1 30); do
  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "  ${GREEN}Frontend running on http://localhost:3000${NC}"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "  ${RED}Frontend failed to start — check /tmp/frontend.log${NC}"
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All services built and running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend:  http://localhost:4000"
echo ""
echo -e "  Stop:     Press Ctrl+C"
echo ""

# Wait
wait
