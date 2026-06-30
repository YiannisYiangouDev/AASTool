#!/bin/bash
# Check status of all AAS services

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AAS — Services Status${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# Database
echo -e "${BLUE}Database (MariaDB):${NC}"
if docker ps 2>/dev/null | grep -qE 'mariadb|aastool-db'; then
  echo -e "  ${GREEN}✓${NC} Running on localhost:3306"
  docker ps --filter "name=mariadb" --filter "name=aastool-db" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
else
  echo -e "  ${RED}✗${NC} Not running"
fi
echo ""

# Backend
echo -e "${BLUE}Backend (Express):${NC}"
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Running on http://localhost:4000"
  if [ -f /tmp/backend.pid ]; then
    PID=$(cat /tmp/backend.pid)
    if kill -0 $PID 2>/dev/null; then
      echo "  PID: $PID"
    fi
  fi
else
  echo -e "  ${RED}✗${NC} Not running"
fi
echo ""

# Frontend
echo -e "${BLUE}Frontend (Next.js):${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} Running on http://localhost:3000"
  if [ -f /tmp/frontend.pid ]; then
    PID=$(cat /tmp/frontend.pid)
    if kill -0 $PID 2>/dev/null; then
      echo "  PID: $PID"
    fi
  fi
else
  echo -e "  ${RED}✗${NC} Not running"
fi
echo ""

# Port overview
PORT_SCAN=""
if command -v ss &>/dev/null; then
  PORT_SCAN="ss -tlnp 2>/dev/null"
elif command -v netstat &>/dev/null; then
  PORT_SCAN="netstat -tuln 2>/dev/null"
fi

echo -e "${BLUE}Port Status:${NC}"
for port in 3000 3306 4000 4040 8080; do
  case $port in
    3000) label="Frontend" ;;
    3306) label="Database" ;;
    4000) label="Backend" ;;
    4040) label="Control Panel" ;;
    8080) label="Adminer" ;;
  esac
  printf "  %-20s : " "$port ($label)"
  if [ -n "$PORT_SCAN" ] && eval "$PORT_SCAN" | grep -q ":$port "; then
    echo -e "${GREEN}IN USE${NC}"
  else
    echo -e "${RED}FREE${NC}"
  fi
done

echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  • Start all:     ${YELLOW}./start-dev.sh${NC}"
echo "  • Stop all:      ${YELLOW}./stop-dev.sh${NC}"
echo "  • View logs:     ${YELLOW}./logs-dev.sh${NC}"
echo "  • Check status:  ${YELLOW}./status-dev.sh${NC}"
echo ""
