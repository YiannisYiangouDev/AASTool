@echo off
title WSL Port Forwarding Setup
color 0B

echo.
echo ════════════════════════════════════════════════════
echo   AAS Tool — WSL Port Forwarding Setup
echo ════════════════════════════════════════════════════
echo.

:: Check admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] This script requires Administrator privileges.
    echo        Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

:: Get WSL IP
echo Detecting WSL IP...
for /f "tokens=*" %%i in ('wsl hostname -I 2^>nul') do set "WSL_IP=%%i"

:: Clean up: trim spaces from WSL_IP
for /f "tokens=1" %%i in ("%WSL_IP%") do set "WSL_IP=%%i"

if "%WSL_IP%"=="" (
    echo [FAIL] Cannot detect WSL IP. Is WSL running?
    pause
    exit /b 1
)

echo WSL IP: %WSL_IP%
echo.

:: Remove old port forwards
netsh interface portproxy delete v4tov4 listenport=4040 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=4000 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0 >nul 2>&1
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0 >nul 2>&1

:: Add new port forwards
echo Setting up port forwarding...
netsh interface portproxy add v4tov4 listenport=4040 listenaddress=0.0.0.0 connectport=4040 connectaddress=%WSL_IP%
if %errorlevel% neq 0 ( echo [FAIL] Port 4040 & goto :fail )
echo   [OK] localhost:4040 ^> WSL:%WSL_IP%:4040  (Control Panel)

netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=%WSL_IP%
if %errorlevel% neq 0 ( echo [FAIL] Port 4000 )
echo   [OK] localhost:4000 ^> WSL:%WSL_IP%:4000  (Backend API)

netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=%WSL_IP%
if %errorlevel% neq 0 ( echo [FAIL] Port 3000 )
echo   [OK] localhost:3000 ^> WSL:%WSL_IP%:3000  (Frontend)

netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=%WSL_IP%
if %errorlevel% neq 0 ( echo [FAIL] Port 8080 )
echo   [OK] localhost:8080 ^> WSL:%WSL_IP%:8080  (Adminer DB)

:: Add Windows Firewall rules (so portproxy actually works)
echo.
echo Opening Windows Firewall...
netsh advfirewall firewall add rule name="AAS Tool - 4040 CP" dir=in action=allow protocol=TCP localport=4040 >nul 2>&1
netsh advfirewall firewall add rule name="AAS Tool - 4000 Backend" dir=in action=allow protocol=TCP localport=4000 >nul 2>&1
netsh advfirewall firewall add rule name="AAS Tool - 3000 Frontend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="AAS Tool - 8080 Adminer" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
echo   [OK] Firewall rules added

echo.
echo Port forwarding is active! All services available at:
echo   • Control Panel:  http://localhost:4040
echo   • Backend API:    http://localhost:4000
echo   • Frontend App:   http://localhost:3000
echo   • Adminer DB:     http://localhost:8080
echo.
echo NOTE: Run this script again if you restart WSL (IP changes).
goto :end

:fail
echo.
echo Something went wrong. Make sure WSL is running.

:end
pause
