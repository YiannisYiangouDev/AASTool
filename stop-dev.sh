#!/bin/bash
# Stop all services for AAS

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping development services...${NC}"
echo ""

# Stop Backend
if [ -f /tmp/backend.pid ]; then
  PID=$(cat /tmp/backend.pid)
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    echo -e "${GREEN}✓${NC} Backend stopped (PID: $PID)"
  else
    echo -e "${YELLOW}ℹ${NC} Backend PID stale — cleaning up"
  fi
  rm /tmp/backend.pid
else
  # Fallback: kill by port
  PORT_PID=$(lsof -ti :4000 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    kill $PORT_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Backend stopped (port 4000, PID: $PORT_PID)"
  else
    echo -e "${YELLOW}ℹ${NC} Backend not running"
  fi
fi

# Stop Frontend
if [ -f /tmp/frontend.pid ]; then
  PID=$(cat /tmp/frontend.pid)
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    echo -e "${GREEN}✓${NC} Frontend stopped (PID: $PID)"
  else
    echo -e "${YELLOW}ℹ${NC} Frontend PID stale — cleaning up"
  fi
  rm /tmp/frontend.pid
else
  PORT_PID=$(lsof -ti :3000 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    kill $PORT_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Frontend stopped (port 3000, PID: $PORT_PID)"
  else
    echo -e "${YELLOW}ℹ${NC} Frontend not running"
  fi
fi

# Stop MariaDB
PROJ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if docker ps 2>/dev/null | grep -q mariadb; then
  cd "$PROJ_DIR/backend"
  docker-compose stop 2>/dev/null
  echo -e "${GREEN}✓${NC} MariaDB stopped"
else
  echo -e "${YELLOW}ℹ${NC} MariaDB not running"
fi

echo ""
echo -e "${GREEN}All services stopped${NC}"
