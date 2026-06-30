#!/bin/bash
# Stop all services for AAS
# Also kills Control Panel (port 4040) and Adminer

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping development services...${NC}"
echo ""

DOCKER_CMD="docker"
if ! command -v docker &>/dev/null && command -v /snap/bin/docker &>/dev/null; then
  DOCKER_CMD="/snap/bin/docker"
fi

# Helper: kill process by port using lsof or ss
kill_port() {
  local port=$1
  local name=$2
  local pid=""
  if command -v lsof &>/dev/null; then
    pid=$(lsof -ti :$port 2>/dev/null)
  elif command -v ss &>/dev/null; then
    pid=$(ss -tlnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K\d+' | head -1)
  fi
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null
    echo -e "${GREEN}✓${NC} $name stopped (PID: $pid)"
  else
    echo -e "${YELLOW}ℹ${NC} $name not running"
  fi
}

# Stop Backend
kill_port 4000 "Backend"

# Stop Frontend
kill_port 3000 "Frontend"

# Stop Control Panel
kill_port 4040 "Control Panel"

# Stop Docker containers
echo -e "${BLUE}Stopping Docker containers...${NC}"
if $DOCKER_CMD ps 2>/dev/null | grep -qE 'mariadb|aastool-db|adminer'; then
  $DOCKER_CMD stop aastool-db mariadb adminer 2>/dev/null
  $DOCKER_CMD rm aastool-db mariadb adminer 2>/dev/null
  echo -e "${GREEN}✓${NC} Docker containers removed"
else
  echo -e "${YELLOW}ℹ${NC} No Docker containers running"
fi

# Kill any leftover node processes by these project paths
pkill -f "node dist/index.js" 2>/dev/null && echo -e "${GREEN}✓${NC} Stale backend killed" || true
pkill -f "next-server" 2>/dev/null && echo -e "${GREEN}✓${NC} Stale frontend killed" || true
pkill -f "node server.js" 2>/dev/null && echo -e "${GREEN}✓${NC} Stale CP killed" || true

echo ""
echo -e "${GREEN}All services stopped${NC}"
