#!/bin/bash
# Start all services for AAS
# Usage: ./start-dev.sh [--no-docker]
#   --no-docker  Skip Docker — use locally installed MySQL/MariaDB

set -e

USE_DOCKER=true
for arg in "$@"; do
  case "$arg" in
    --no-docker) USE_DOCKER=false ;;
  esac
done

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
  if [ -f /tmp/backend.pid ]; then
    kill $(cat /tmp/backend.pid) 2>/dev/null || true
    rm /tmp/backend.pid
  fi
  if [ -f /tmp/frontend.pid ]; then
    kill $(cat /tmp/frontend.pid) 2>/dev/null || true
    rm /tmp/frontend.pid
  fi
  echo -e "${GREEN}✓${NC} All services stopped"
  exit 0
}
trap cleanup EXIT INT TERM

print_status() {
  echo -e "${GREEN}✓${NC} $1"
}
print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}
print_error() {
  echo -e "${RED}✗${NC} $1"
}

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AAS — Development Environment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Auto-create .env and load it — required for fresh clones
echo -e "${YELLOW}Step 0: Loading environment...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  print_info "No .env found — copying from .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo ""
  echo -e "  ${BLUE}Tip:${NC} To use a local MySQL (no Docker), run:"
  echo -e "       ${YELLOW}./setup-db.sh${NC}     (creates DB + seeds data)"
  echo -e "       ${YELLOW}./start-dev.sh --no-docker${NC}"
  echo ""
fi
export $(grep -v '^#' "$BACKEND_DIR/.env" | tr -d '\r' | xargs)
print_status "Environment loaded"
echo ""

port_in_use() {
  netstat -tuln 2>/dev/null | grep -q ":$1 " && return 0 || return 1
}

echo -e "${YELLOW}Step 1: Starting MariaDB (Docker)...${NC}"
if [ "$USE_DOCKER" = false ]; then
  print_info "Skipping Docker (--no-docker flag)"
  if ! port_in_use 3306; then
    print_error "No MariaDB detected on port 3306."
    print_info "Run './setup-db.sh' first to set up a local MySQL/MariaDB,"
    print_info "or start this script without --no-docker to use Docker."
    exit 1
  fi
  print_status "Using existing MariaDB on port 3306"
elif port_in_use 3306; then
  print_status "MariaDB already running on port 3306"
else
  cd "$BACKEND_DIR"

  if ! docker ps 2>/dev/null | grep -q mariadb; then
    print_info "Starting MariaDB container..."
    if command -v docker &> /dev/null; then
      docker-compose up -d 2>/dev/null || {
        print_error "Docker Compose failed. Run from PowerShell instead:"
        echo "  cd backend && docker-compose up -d"
        exit 1
      }
    else
      print_error "Docker not found. Please install Docker Desktop."
      exit 1
    fi

    print_info "Waiting for MariaDB to be ready..."
    sleep 3
    for i in {1..10}; do
      if nc -z 127.0.0.1 3306 2>/dev/null; then
        print_status "MariaDB is ready"
        break
      fi
      if [ $i -eq 10 ]; then
        print_error "MariaDB failed to start — check docker logs mariadb"
        exit 1
      fi
      sleep 1
    done
  else
    print_status "MariaDB container already running"
  fi
fi
echo ""

echo -e "${YELLOW}Step 2: Starting Backend (Express/ts-node)...${NC}"
if port_in_use 4000; then
  print_info "Port 4000 in use — killing stale process..."
  lsof -ti :4000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
cd "$BACKEND_DIR"

# Auto-install deps + build if dist/ missing (fresh clone)
if [ ! -f dist/index.js ]; then
  print_info "dist/ not found — installing dependencies..."
  npm install --silent 2>&1 | tail -1
  print_info "Building TypeScript..."
  npm run build 2>&1 | tail -1
  print_status "Backend built successfully"
fi

export DATABASE_URL="${DATABASE_URL:-mysql://myuser:mypassword@127.0.0.1:3306/mydb}"
print_info "Starting backend on port 4000..."
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/backend.pid
for i in {1..30}; do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    print_status "Backend running on http://localhost:4000"
    break
  fi
  if [ $i -eq 30 ]; then
    print_error "Backend failed to start. Check /tmp/backend.log"
    cat /tmp/backend.log
    exit 1
  fi
  sleep 1
done
echo ""

echo -e "${YELLOW}Step 3: Starting Frontend (Next.js)...${NC}"
if port_in_use 3000; then
  print_info "Port 3000 in use — killing stale process..."
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
cd "$FRONTEND_DIR"

# Auto-install deps if node_modules missing (fresh clone)
if [ ! -d node_modules ]; then
  print_info "node_modules/ not found — installing dependencies..."
  npm install --silent 2>&1 | tail -1
  print_status "Frontend dependencies installed"
fi

print_info "Starting frontend on port 3000..."
PORT=3000 npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/frontend.pid
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend running on http://localhost:3000"
    break
  fi
  if [ $i -eq 30 ]; then
    print_error "Frontend failed to start. Check /tmp/frontend.log"
    tail -20 /tmp/frontend.log
    exit 1
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ All services running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  • Database:  MariaDB on ${BLUE}localhost:3306${NC} (Docker)"
echo "  • Backend:   ${BLUE}http://localhost:4000${NC} (npm start)"
echo "  • Frontend:  ${BLUE}http://localhost:3000${NC} (npm run dev)"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  • Backend:   tail -f /tmp/backend.log"
echo "  • Frontend:  tail -f /tmp/frontend.log"
echo "  • Database:  docker logs -f mariadb"
echo ""
echo -e "${BLUE}Stop all services:${NC}"
echo "  • Run: ${YELLOW}./stop-dev.sh${NC}"
echo "  • Or press Ctrl+C"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────${NC}"
echo -e "  © $(date +%Y) AAS Tool — All Rights Reserved"
echo -e "${BLUE}────────────────────────────────────────────────${NC}"
echo ""

wait
