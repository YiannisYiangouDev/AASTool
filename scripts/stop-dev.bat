@echo off
title AAS Tool — Stopping Services
color 0E

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Stopping Services
echo ════════════════════════════════════════════════════
echo.

:: Check if WSL is available
wsl exit 0 >nul 2>&1
if errorlevel 1 (
    set "HAS_WSL=0"
) else (
    set "HAS_WSL=1"
)

:: Kill backend node process on port 4000
echo [1/4] Stopping Backend...
if "%HAS_WSL%"=="1" (
    wsl pkill -f "node dist/index.js" 2>/dev/null
    echo   Backend stopped
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000.*LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
        echo   Backend ^(PID %%a^) stopped
    )
)

:: Kill frontend node process on port 3000
echo [2/4] Stopping Frontend...
if "%HAS_WSL%"=="1" (
    wsl pkill -f "next-server" 2>/dev/null
    wsl pkill -f "next dev" 2>/dev/null
    echo   Frontend stopped
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
        echo   Frontend ^(PID %%a^) stopped
    )
)

:: Stop Docker containers
echo [3/4] Stopping Docker containers...
if "%HAS_WSL%"=="1" (
    wsl bash -lc "docker stop aastool-db mariadb adminer 2>/dev/null; docker rm aastool-db mariadb adminer 2>/dev/null"
    echo   Docker containers stopped
) else (
    docker stop aastool-db mariadb adminer >nul 2>&1
    docker rm aastool-db mariadb adminer >nul 2>&1
    echo   Docker containers stopped
)

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
