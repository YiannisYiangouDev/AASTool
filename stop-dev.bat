@echo off
title AAS Tool — Stopping Services
color 0E

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Stopping Services
echo ════════════════════════════════════════════════════
echo.

:: Kill backend node process on port 4000
echo [1/4] Stopping Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000.*LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   Backend ^(PID %%a^) stopped
)
echo   Done

:: Kill frontend node process on port 3000
echo [2/4] Stopping Frontend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   Frontend ^(PID %%a^) stopped
)
echo   Done

:: Stop Docker MariaDB container
echo [3/4] Stopping MariaDB ^(Docker^)...
docker stop mariadb >nul 2>&1
if %errorlevel% equ 0 (
    echo   MariaDB container stopped
) else (
    echo   MariaDB not running or Docker unavailable
)

:: Cleanup any orphaned node processes
echo [4/4] Cleaning up...
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq AAS*" >nul 2>&1
echo   Done

echo.
echo All services stopped.
echo ─────────────────────────────────────────────────
echo   (c) %date:~10,4% AAS Tool — All Rights Reserved
echo ─────────────────────────────────────────────────
echo.

pause
