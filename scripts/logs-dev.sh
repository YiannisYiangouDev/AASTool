#!/bin/bash
# View logs for AAS services
# Usage: ./logs-dev.sh [backend|frontend|database]

SERVICE="${1:-all}"

case "$SERVICE" in
    backend)
        echo "=== Backend Logs (tail -f) ==="
        if [ -f /tmp/backend.log ]; then
            tail -f /tmp/backend.log
        else
            echo "No backend log file found. Start the backend first."
        fi
        ;;
    frontend)
        echo "=== Frontend Logs (tail -f) ==="
        if [ -f /tmp/frontend.log ]; then
            tail -f /tmp/frontend.log
        else
            echo "No frontend log file found. Start the frontend first."
        fi
        ;;
    database)
        echo "=== MariaDB Logs (tail -f) ==="
        docker logs -f mariadb 2>/dev/null || docker logs -f aastool-db 2>/dev/null || echo "MariaDB not running. Start it first."
        ;;
    all|*)
        echo "=== Last 20 lines of all service logs ==="
        echo ""
        echo "--- Backend ---"
        if [ -f /tmp/backend.log ]; then
            tail -20 /tmp/backend.log
        else
            echo "(not available)"
        fi
        echo ""
        echo "--- Frontend ---"
        if [ -f /tmp/frontend.log ]; then
            tail -20 /tmp/frontend.log
        else
            echo "(not available)"
        fi
        echo ""
        echo "--- MariaDB ---"
        docker logs --tail 20 mariadb 2>/dev/null || docker logs --tail 20 aastool-db 2>/dev/null || echo "(not available)"
        ;;
esac

BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Development Services Logs${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

if [ "$1" == "backend" ]; then
  echo -e "${YELLOW}Backend logs (Ctrl+C to stop):${NC}"
  tail -f /tmp/backend.log
elif [ "$1" == "frontend" ]; then
  echo -e "${YELLOW}Frontend logs (Ctrl+C to stop):${NC}"
  tail -f /tmp/frontend.log
elif [ "$1" == "database" ]; then
  echo -e "${YELLOW}Database logs (Ctrl+C to stop):${NC}"
  docker logs -f proj-mariadb-1
else
  echo -e "${YELLOW}Usage: ./logs-dev.sh [backend|frontend|database]${NC}"
  echo ""
  echo "Examples:"
  echo "  ./logs-dev.sh backend    - View backend logs"
  echo "  ./logs-dev.sh frontend   - View frontend logs"
  echo "  ./logs-dev.sh database   - View database logs"
  echo ""
  echo -e "${YELLOW}Current log files:${NC}"
  echo ""
  
  if [ -f /tmp/backend.log ]; then
    echo -e "  ${BLUE}Backend (/tmp/backend.log):${NC}"
    tail -5 /tmp/backend.log | sed 's/^/    /'
    echo ""
  fi
  
  if [ -f /tmp/frontend.log ]; then
    echo -e "  ${BLUE}Frontend (/tmp/frontend.log):${NC}"
    tail -5 /tmp/frontend.log | sed 's/^/    /'
    echo ""
  fi
fi
