@echo off
setlocal enabledelayedexpansion
title AAS Tool — Database Setup

:: ============================================================
::  AAS Tool — Local MySQL Setup ^(No Docker Required^)
::  Creates the database, user, and seeds all tables
:: ============================================================

pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd
set "BACKEND_DIR=%PROJECT_ROOT%\backend"

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — Database Setup ^(Local MySQL^)
echo ════════════════════════════════════════════════════
echo.

:: ---- Step 1: Check prerequisites ----
echo [Step 1] Checking prerequisites...

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   [OK] Node.js %%v

:: Check mysql client
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   [WARN] mysql client not found in PATH.
    echo   You need MySQL or MariaDB installed locally.
    echo.
    echo   Options:
    echo     [1] Install MariaDB:  https://mariadb.org/download/
    echo     [2] Install MySQL:    https://dev.mysql.com/downloads/
    echo     [3] Use XAMPP ^(includes MariaDB^): https://www.apachefriends.org/
    echo     [4] Continue anyway ^(I already have MySQL running^)
    echo.
    choice /c 1234 /n /m "  Choose [1/2/3/4]: "
    if !errorlevel! equ 1 start "" "https://mariadb.org/download/"
    if !errorlevel! equ 2 start "" "https://dev.mysql.com/downloads/"
    if !errorlevel! equ 3 start "" "https://www.apachefriends.org/"
    echo.
) else (
    echo   [OK] mysql client found
)
echo.

:: ---- Step 2: Ask for credentials ----
echo [Step 2] Database credentials
echo.
echo   We'll create a database called 'mydb' with user 'myuser'.
echo   Enter your MySQL root credentials:
echo.
set /p MYSQL_HOST="  MySQL host [127.0.0.1]: "
if "!MYSQL_HOST!"=="" set "MYSQL_HOST=127.0.0.1"
set /p MYSQL_PORT="  MySQL port [3306]: "
if "!MYSQL_PORT!"=="" set "MYSQL_PORT=3306"
set /p MYSQL_ROOT_USER="  Root username [root]: "
if "!MYSQL_ROOT_USER!"=="" set "MYSQL_ROOT_USER=root"

:: Get password without echoing
set "PSPrompt="
set "MYSQL_ROOT_PASS="
echo   Root password ^(input hidden^):
powershell -Command "$p=Read-Host -AsSecureString; $BSTR=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)" > "%TEMP%\aas_db_pass.txt" 2>nul
set /p MYSQL_ROOT_PASS=<"%TEMP%\aas_db_pass.txt"
del "%TEMP%\aas_db_pass.txt" 2>nul

set "APP_USER=myuser"
set "APP_PASS=mypassword"
set "APP_DB=mydb"
echo.

:: ---- Step 3: Create database and user ----
echo [Step 3] Creating database and user...

:: Try with password
mysql -h !MYSQL_HOST! -P !MYSQL_PORT! -u !MYSQL_ROOT_USER! -p"!MYSQL_ROOT_PASS!" -e "
  CREATE DATABASE IF NOT EXISTS !APP_DB! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS '!APP_USER!'@'%' IDENTIFIED BY '!APP_PASS!';
  GRANT ALL PRIVILEGES ON !APP_DB!.* TO '!APP_USER!'@'%';
  FLUSH PRIVILEGES;
  SELECT 'OK' AS status;
" 2>nul | findstr "OK" >nul

if !errorlevel! neq 0 (
    :: Try without password
    mysql -h !MYSQL_HOST! -P !MYSQL_PORT! -u !MYSQL_ROOT_USER! -e "
      CREATE DATABASE IF NOT EXISTS !APP_DB! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      CREATE USER IF NOT EXISTS '!APP_USER!'@'%' IDENTIFIED BY '!APP_PASS!';
      GRANT ALL PRIVILEGES ON !APP_DB!.* TO '!APP_USER!'@'%';
      FLUSH PRIVILEGES;
    " 2>nul
    if !errorlevel! neq 0 (
        echo   [FAIL] Could not connect to MySQL.
        echo   Check host, port, username, and password.
        echo.
        echo   You can also create the DB manually:
        echo     CREATE DATABASE mydb;
        echo     CREATE USER 'myuser'@'%%' IDENTIFIED BY 'mypassword';
        echo     GRANT ALL ON mydb.* TO 'myuser'@'%%';
        echo.
        pause
        exit /b 1
    )
)

echo   [OK] Database '!APP_DB!' and user '!APP_USER!' created
echo.

:: ---- Step 4: Write .env ----
echo [Step 4] Writing .env file...
(
    echo DATABASE_URL="mysql://!APP_USER!:!APP_PASS!@!MYSQL_HOST!:!MYSQL_PORT!/!APP_DB!"
    echo DB_TYPE=mariadb
    echo TYPEORM_SYNCHRONIZE=false
    echo JWT_SECRET="change-me-to-a-random-string"
    echo JWT_EXPIRES_IN=3600
    echo PORT=4000
    echo APP_VERSION=1.0.0
    echo LOGIN_REDIRECT=/dashboard
) > "%BACKEND_DIR%\.env"
echo   [OK] .env written
echo.

:: ---- Step 5: Install deps + build ----
echo [Step 5] Building backend...
cd /d "%BACKEND_DIR%"

if not exist "node_modules\" (
    echo   Installing dependencies...
    call npm install 2>&1
)
echo   Compiling TypeScript...
call npm run build 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Build failed
    pause
    exit /b 1
)
echo   [OK] Build complete
echo.

:: ---- Step 6: Seed all data ----
echo [Step 6] Seeding database...
node dist\scripts\seed.js
if %errorlevel% neq 0 (
    echo   [FAIL] Seed failed
    pause
    exit /b 1
)
echo   [OK] All data seeded
echo.

:: ---- Done ----
echo ════════════════════════════════════════════════════
echo   Database setup complete!
echo ════════════════════════════════════════════════════
echo.
echo   Database:  !APP_DB! @ !MYSQL_HOST!:!MYSQL_PORT!
echo   User:      !APP_USER!
echo.
echo   Next step: Run start-dev.bat to launch the app
echo ─────────────────────────────────────────────────
echo   ^(c) %date:~10,4% AAS Tool — All Rights Reserved
echo ─────────────────────────────────────────────────
echo.

cd /d "%PROJECT_ROOT%"
pause
endlocal
