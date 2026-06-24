#!/bin/bash
# ============================================================
#  AAS Tool — Control Panel Launcher
#  Opens the GUI dashboard to start/stop services
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CP_DIR="$PROJECT_ROOT/control-panel"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  AAS Control Panel                               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Install deps if needed
if [ ! -d "$CP_DIR/node_modules" ]; then
  echo "Installing control panel dependencies..."
  cd "$CP_DIR" && npm install 2>&1
fi

# Open browser
BROWSER=""
if command -v xdg-open &>/dev/null; then
  BROWSER="xdg-open"
elif command -v open &>/dev/null; then
  BROWSER="open"
elif command -v start &>/dev/null; then
  BROWSER="start"
fi

if [ -n "$BROWSER" ]; then
  sleep 1 && $BROWSER "http://localhost:4040" &
fi

# Start the control panel
cd "$CP_DIR"
node server.js
