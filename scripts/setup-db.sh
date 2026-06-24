#!/bin/bash
# ============================================================
#  AAS Tool — Local MySQL Setup (No Docker Required)
#  Creates the database, user, and seeds all tables
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_info()   { echo -e "${BLUE}ℹ${NC} $1"; }
print_error()  { echo -e "${RED}✗${NC} $1"; }

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  AAS Tool — Database Setup (Local MySQL)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo ""

# ---- Step 1: Check prerequisites ----
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  print_error "Node.js not found. Install from https://nodejs.org/"
  exit 1
fi
print_info "Node.js $(node -v)"

if ! command -v mysql &> /dev/null; then
  print_error "mysql client not found in PATH."
  echo ""
  echo "  You need MySQL or MariaDB installed locally."
  echo "  Install options:"
  echo "    • Ubuntu/Debian:  sudo apt install mariadb-server mariadb-client"
  echo "    • macOS:          brew install mariadb"
  echo "    • Windows:        Use setup-db.bat instead"
  echo ""
  echo "  Or use Docker:    ./start-dev.sh  (auto-starts MariaDB)"
  exit 1
fi
print_info "mysql client found: $(mysql --version 2>&1 | head -1)"

echo ""

# ---- Step 2: Get credentials ----
echo -e "${YELLOW}Step 2: Database credentials${NC}"
echo ""

read -p "  MySQL host [127.0.0.1]: " MYSQL_HOST
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
read -p "  MySQL port [3306]: " MYSQL_PORT
MYSQL_PORT="${MYSQL_PORT:-3306}"
read -p "  Root username [root]: " MYSQL_ROOT_USER
MYSQL_ROOT_USER="${MYSQL_ROOT_USER:-root}"
read -s -p "  Root password (input hidden): " MYSQL_ROOT_PASS
echo ""

APP_USER="myuser"
APP_PASS="mypassword"
APP_DB="mydb"

echo ""

# ---- Step 3: Create database and user ----
echo -e "${YELLOW}Step 3: Creating database and user...${NC}"

MYSQL_CMD="mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_ROOT_USER"
if [ -n "$MYSQL_ROOT_PASS" ]; then
  MYSQL_CMD="$MYSQL_CMD -p\"$MYSQL_ROOT_PASS\""
fi

if ! eval "$MYSQL_CMD -e 'SELECT 1' > /dev/null 2>&1"; then
  print_error "Could not connect to MySQL. Check host, port, username, and password."
  echo ""
  echo "  You can also create the DB manually:"
  echo "    CREATE DATABASE mydb;"
  echo "    CREATE USER 'myuser'@'%' IDENTIFIED BY 'mypassword';"
  echo "    GRANT ALL ON mydb.* TO 'myuser'@'%';"
  exit 1
fi

eval "$MYSQL_CMD -e \"
  CREATE DATABASE IF NOT EXISTS $APP_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS '$APP_USER'@'%' IDENTIFIED BY '$APP_PASS';
  GRANT ALL PRIVILEGES ON $APP_DB.* TO '$APP_USER'@'%';
  FLUSH PRIVILEGES;
\""

print_status "Database '$APP_DB' and user '$APP_USER' created"
echo ""

# ---- Step 4: Write .env ----
echo -e "${YELLOW}Step 4: Writing .env file...${NC}"
cat > "$BACKEND_DIR/.env" << EOF
DATABASE_URL="mysql://$APP_USER:$APP_PASS@$MYSQL_HOST:$MYSQL_PORT/$APP_DB"
DB_TYPE=mariadb
TYPEORM_SYNCHRONIZE=false
JWT_SECRET="change-me-to-a-random-string"
JWT_EXPIRES_IN=3600
PORT=4000
APP_VERSION=1.0.0
LOGIN_REDIRECT=/dashboard
EOF
print_status ".env written"
echo ""

# ---- Step 5: Install deps + build ----
echo -e "${YELLOW}Step 5: Building backend...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ]; then
  print_info "Installing dependencies..."
  npm install 2>&1
fi

print_info "Compiling TypeScript..."
npm run build 2>&1
print_status "Build complete"
echo ""

# ---- Step 6: Seed all data ----
echo -e "${YELLOW}Step 6: Seeding database...${NC}"
node dist/scripts/seed.js
print_status "All data seeded"
echo ""

# ---- Done ----
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Database setup complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Database:  ${BLUE}$APP_DB${NC} @ ${BLUE}$MYSQL_HOST:$MYSQL_PORT${NC}"
echo -e "  User:      ${BLUE}$APP_USER${NC}"
echo ""
echo -e "  Next step: ${YELLOW}./start-dev.sh --no-docker${NC} to launch"
echo -e "${BLUE}────────────────────────────────────────────────${NC}"
echo -e "  © $(date +%Y) AAS Tool — All Rights Reserved"
echo -e "${BLUE}────────────────────────────────────────────────${NC}"
echo ""
