@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo            LinkUp - Network Explorer
echo ============================================================
echo.
echo Starting backend server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Kill any existing node processes on port 5000
netstat -ano | findstr :5000 >nul 2>&1
if !errorlevel! equ 0 (
    echo Stopping existing server...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

REM Start the server in background
start "LinkUp Backend Server" npm run server

REM Wait for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening LinkUp Network Explorer...
timeout /t 1 /nobreak >nul

REM Try to open with default browser
start http://localhost:5000/pages/network_explorer.html

echo.
echo ============================================================
echo Server running on: http://localhost:5000
echo Network Explorer: http://localhost:5000/pages/network_explorer.html
echo ============================================================
echo.
echo Press Ctrl+C in the server window to stop the server
echo.

REM Keep this window open
pause
