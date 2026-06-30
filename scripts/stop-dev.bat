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

:: Kill backend on port 4000
echo [1/5] Stopping Backend...
if "%HAS_WSL%"=="1" (
    wsl bash -c "pkill -f 'node dist/index.js' 2>/dev/null; echo done"
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000.*LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo   Backend stopped

:: Kill frontend on port 3000
echo [2/5] Stopping Frontend...
if "%HAS_WSL%"=="1" (
    wsl bash -c "pkill -f 'next-server' 2>/dev/null; pkill -f 'next dev' 2>/dev/null; echo done"
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo   Frontend stopped

:: Kill Control Panel on port 4040
echo [3/5] Stopping Control Panel...
if "%HAS_WSL%"=="1" (
    wsl bash -c "pkill -f 'node server.js' 2>/dev/null; echo done"
) else (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4040.*LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo   Control Panel stopped

:: Stop Docker containers
echo [4/5] Stopping Docker containers...
if "%HAS_WSL%"=="1" (
    wsl bash -lc "docker stop aastool-db mariadb adminer 2>/dev/null; docker rm aastool-db mariadb adminer 2>/dev/null; echo done"
) else (
    docker stop aastool-db mariadb adminer >nul 2>&1
    docker rm aastool-db mariadb adminer >nul 2>&1
)
echo   Docker containers removed

:: Cleanup any orphaned CMD windows
echo [5/5] Cleaning up...
taskkill /f /fi "WINDOWTITLE eq AAS*" >nul 2>&1

echo.
echo All services stopped.
echo ─────────────────────────────────────────────────
echo   (c) %date:~10,4% AAS Tool — All Rights Reserved
echo ─────────────────────────────────────────────────
echo.

pause
