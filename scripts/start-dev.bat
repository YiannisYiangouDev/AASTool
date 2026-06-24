@echo off
setlocal enabledelayedexpansion
title AAS Tool — Development Environment
color 0B

:: ============================================================
::  AAS Tool — Windows Start Script
::  Starts MariaDB (Docker), Backend, and Frontend
:: ============================================================

pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"

:: Convert Windows paths to WSL paths (e.g. C:\foo\bar -> /mnt/c/foo/bar)
set "WSL_ROOT=%PROJECT_ROOT:\=/%"
set "WSL_ROOT=%WSL_ROOT:C:=/mnt/c%"
set "WSL_ROOT=%WSL_ROOT:D:=/mnt/d%"
set "WSL_ROOT=%WSL_ROOT:E:=/mnt/e%"
set "WSL_BACKEND=%WSL_ROOT%/backend"
set "WSL_FRONTEND=%WSL_ROOT%/frontend"

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

:: Check WSL
echo   Checking WSL...
wsl exit 0 >nul 2>&1
if errorlevel 1 (
    echo   [WARN] WSL not available. Make sure WSL is installed.
) else (
    echo   [OK] WSL ready
    :: Check Docker in WSL
    wsl docker info >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] Docker not running in WSL. DB container may not start.
    ) else (
        for /f "tokens=*" %%v in ('wsl docker -v') do set "DOCKER_VER=%%v"
        echo   [OK] !DOCKER_VER! ^(in WSL^)
    )
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

:: ---- Step 2: MariaDB via Docker (WSL) ----
echo [Step 2] Starting MariaDB ^(Docker in WSL^)...
wsl docker ps 2>nul | findstr /c:"mariadb" >nul
if errorlevel 1 (
    echo   Starting MariaDB container...
    wsl docker compose -f "%WSL_BACKEND%/docker-compose.yml" up -d 2>&1
    if errorlevel 1 (
        echo   [FAIL] Could not start MariaDB. Is WSL running?
    ) else (
        echo   [OK] MariaDB container started
    )
) else (
    echo   [OK] MariaDB container already running
)
echo.

:: ---- Step 3: Backend (via WSL) ----
echo [Step 3] Starting Backend ^(Express in WSL^)...
echo   Starting backend on http://localhost:4000 ...
start "AAS Backend" wsl bash -c "cd %WSL_BACKEND% && node dist/index.js"
echo   [OK] Backend starting in new window

:: ---- Step 4: Frontend (via WSL) ----
echo [Step 4] Starting Frontend ^(Next.js in WSL^)...
echo   Starting frontend on http://localhost:3000 ...
start "AAS Frontend" wsl bash -c "cd %WSL_FRONTEND% && PORT=3000 npm run dev"
echo   [OK] Frontend starting in new window

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
