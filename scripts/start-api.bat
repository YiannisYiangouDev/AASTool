@echo off
setlocal enabledelayedexpansion
title AAS Tool — API Only
color 0A

:: ============================================================
::  AAS Tool — Start API Only
::  Starts just the backend Express API (no frontend, no DB).
::  Assumes MariaDB/MySQL is already running on localhost:3306.
:: ============================================================

pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd
set "BACKEND_DIR=%PROJECT_ROOT%\backend"

:: Convert Windows paths to WSL paths
set "WSL_ROOT=%PROJECT_ROOT:\=/%"
set "WSL_ROOT=%WSL_ROOT:C:=/mnt/c%"
set "WSL_ROOT=%WSL_ROOT:D:=/mnt/d%"
set "WSL_ROOT=%WSL_ROOT:E:=/mnt/e%"
set "WSL_BACKEND=%WSL_ROOT%/backend"

set "HAS_WSL=0"
wsl exit 0 >nul 2>&1
if not errorlevel 1 set "HAS_WSL=1"

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Start API Only
echo ════════════════════════════════════════════════════
echo.

:: ---- Step 1: Check prerequisites ----
echo [Step 1] Checking prerequisites...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Node.js not found.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   [OK] Node.js %%v
echo.

:: ---- Step 2: Check .env ----
echo [Step 2] Checking environment...
if not exist "%BACKEND_DIR%\.env" (
    echo   No .env found — copying from .env.example
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
)
echo   [OK] Environment ready
echo.

:: ---- Step 3: Build if needed ----
echo [Step 3] Checking build...
if not exist "%BACKEND_DIR%\dist\index.js" (
    echo   Building TypeScript...
    cd /d "%BACKEND_DIR%"
    call npm install --silent 2>&1
    call npm run build 2>&1
    if errorlevel 1 (
        echo   [FAIL] Build failed
        pause
        exit /b 1
    )
    echo   [OK] Build complete
) else (
    echo   [OK] Already built
)
echo.

:: ---- Step 4: Start API ----
echo [Step 4] Starting API on http://localhost:4000 ...
if "%HAS_WSL%"=="1" (
    start "AAS API" wsl bash -c "cd %WSL_BACKEND% && node dist/index.js"
) else (
    start "AAS API" cmd /c "cd /d %BACKEND_DIR% && node dist\index.js"
)
echo   [OK] API starting
echo.

:: ---- Done ----
echo ════════════════════════════════════════════════════
echo   API starting!
echo ════════════════════════════════════════════════════
echo.
echo   * Backend API:  http://localhost:4000
echo   * Health check: http://localhost:4000/health
echo.
echo   Stop: Close the "AAS API" window
echo.

endlocal
