@echo off
title AAS Control Panel
color 0B

set "CP_DIR=%~dp0control-panel"

echo.
echo ════════════════════════════════════════════════════
echo   AAS Control Panel
echo ════════════════════════════════════════════════════
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

:: Install deps if needed
if not exist "%CP_DIR%\node_modules\" (
    echo Installing control panel dependencies...
    cd /d "%CP_DIR%"
    call npm install 2>&1
)

:: Start control panel
cd /d "%CP_DIR%"
echo Starting Control Panel on http://localhost:4040 ...
echo.
start "" http://localhost:4040
node server.js

pause
