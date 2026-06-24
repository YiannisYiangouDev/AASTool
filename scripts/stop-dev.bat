@echo off
title AAS Tool — Stopping Services
color 0E

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Stopping Services
echo ════════════════════════════════════════════════════
echo.

:: Kill backend node process on port 4000 (Windows + WSL)
echo [1/4] Stopping Backend...
wsl pkill -f "node dist/index.js" 2>/dev/null
echo   Backend stopped

:: Kill frontend node process on port 3000 (WSL)
echo [2/4] Stopping Frontend...
wsl pkill -f "next-server" 2>/dev/null
wsl pkill -f "next dev" 2>/dev/null
echo   Frontend stopped

:: Stop Docker containers (mariadb or aastool-db, and adminer)
echo [3/4] Stopping Docker containers...
wsl bash -lc "docker stop aastool-db mariadb adminer 2>/dev/null; docker rm aastool-db mariadb adminer 2>/dev/null"
echo   Docker containers stopped

:: Cleanup any orphaned Windows CMD windows
echo [4/4] Cleaning up...
taskkill /f /fi "WINDOWTITLE eq AAS*" >nul 2>&1

echo.
echo All services stopped.
echo ─────────────────────────────────────────────────
echo   (c) %date:~10,4% AAS Tool — All Rights Reserved
echo ─────────────────────────────────────────────────
echo.

pause
