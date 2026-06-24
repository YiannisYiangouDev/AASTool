@echo off
setlocal enabledelayedexpansion
title AAS Tool — Development Environment
color 0B

:: ============================================================
::  AAS Tool — Windows Start Script
::  Starts MariaDB (Docker), Backend, and Frontend
:: ============================================================

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Development Environment ^(Windows^)
echo ════════════════════════════════════════════════════
echo.

:: ---- Step 0: Prerequisite checks ----
echo [Step 0] Checking prerequisites...

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Node.js not found.
    echo   Please install Node.js from: https://nodejs.org/
    echo   Recommended: LTS version
    start "" https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo   [OK] Node.js %NODE_VER%

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] npm not found.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set "NPM_VER=%%v"
echo   [OK] npm v%NPM_VER%

:: Check Docker
set "DOCKER_OK=0"
where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker info >nul 2>&1
    if !errorlevel! equ 0 (
        set "DOCKER_OK=1"
        for /f "tokens=*" %%v in ('docker -v') do set "DOCKER_VER=%%v"
        echo   [OK] !DOCKER_VER!
    )
)

if "!DOCKER_OK!"=="0" (
    echo.
    echo   [WARN] Docker not found or not running.
    echo.
    echo   How would you like to set up the database?
    echo     [1] Open Docker Desktop download page
    echo     [2] Use local MySQL/MariaDB ^(run setup-db.bat first^)
    echo     [3] Continue — DB already running on localhost:3306
    echo     [4] Exit
    echo.
    echo   Tip: Run setup-db.bat to install a local MariaDB & seed data
    echo        without needing Docker.
    echo.
    choice /c 1234 /n /m "  Choose [1/2/3/4]: "
    if !errorlevel! equ 1 (
        start "" "https://www.docker.com/products/docker-desktop/"
        echo   Opening Docker Desktop download page...
        echo   After installing, re-run this script.
        pause
        exit /b 0
    )
    if !errorlevel! equ 2 (
        echo.
        echo   Launching setup-db.bat ...
        start "" /wait cmd /c "%~dp0setup-db.bat"
        echo.
        echo   Database setup complete. Continuing...
    )
    if !errorlevel! equ 4 (
        exit /b 0
    )
    echo   Continuing — assuming DB is already running...
)

echo.

:: ---- Step 1: .env setup ----
echo [Step 1] Setting up environment...
if not exist "%BACKEND_DIR%\.env" (
    echo   No .env found — copying from .env.example
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
)
echo   [OK] Environment ready
echo.

:: ---- Step 2: MariaDB via Docker ----
echo [Step 2] Starting MariaDB ^(Docker^)...
if "!DOCKER_OK!"=="1" (
    docker ps 2>nul | findstr /c:"mariadb" >nul
    if !errorlevel! equ 0 (
        echo   [OK] MariaDB container already running
    ) else (
        echo   Starting MariaDB container...
        cd /d "%BACKEND_DIR%"
        docker compose up -d 2>nul || docker-compose up -d 2>nul
        if !errorlevel! neq 0 (
            echo   [FAIL] Could not start MariaDB. Check Docker Desktop.
        ) else (
            echo   [OK] MariaDB container started
        )
        cd /d "%PROJECT_ROOT%"
    )
) else (
    echo   [SKIP] Docker not available — assuming DB on localhost:3306
)
echo.

:: ---- Step 3: Backend ----
echo [Step 3] Starting Backend ^(Express^)...
cd /d "%BACKEND_DIR%"

:: Auto-install + build if needed
if not exist "dist\index.js" (
    echo   dist\ not found — installing dependencies...
    call npm install --silent 2>&1
    echo   Building TypeScript...
    call npm run build 2>&1
    echo   [OK] Backend built
)

echo   Starting backend on http://localhost:4000 ...
start "AAS Backend" cmd /c "cd /d %BACKEND_DIR% && node dist\index.js"
echo   [OK] Backend starting in new window
cd /d "%PROJECT_ROOT%"
echo.

:: ---- Step 4: Frontend ----
echo [Step 4] Starting Frontend ^(Next.js^)...
cd /d "%FRONTEND_DIR%"

:: Auto-install if needed
if not exist "node_modules\" (
    echo   node_modules\ not found — installing dependencies...
    call npm install --silent 2>&1
    echo   [OK] Frontend dependencies installed
)

echo   Starting frontend on http://localhost:3000 ...
set "PORT=3000"
start "AAS Frontend" cmd /c "cd /d %FRONTEND_DIR% && set PORT=3000 && npm run dev"
echo   [OK] Frontend starting in new window
cd /d "%PROJECT_ROOT%"
echo.

:: ---- Done ----
echo ════════════════════════════════════════════════════
echo   All services starting!
echo ════════════════════════════════════════════════════
echo.
echo   Services:
echo     * Database:   MariaDB on localhost:3306 ^(Docker^)
echo     * Backend:    http://localhost:4000
echo     * Frontend:   http://localhost:3000
echo.
echo   Stop services:
echo     * Close the "AAS Backend" and "AAS Frontend" windows
echo     * docker stop mariadb  ^(or use Docker Desktop^)
echo.
echo ─────────────────────────────────────────────────
echo   (c) %date:~10,4% AAS Tool — All Rights Reserved
echo ─────────────────────────────────────────────────
echo.

:: Open browser after a short delay
echo   Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start "" http://localhost:3000

pause
endlocal
