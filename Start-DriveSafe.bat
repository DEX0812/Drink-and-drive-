@echo off
SETLOCAL EnableDelayedExpansion
TITLE DriveSafe Platform Launcher
COLOR 0B

SET "PROJECT_DIR=%~dp0"
CD /D "%PROJECT_DIR%"

echo.
echo  ================================================
echo    DRIVESAFE PLATFORM - PRODUCTION BUILD v1.0
echo    On-Demand Personal Driver Service
echo  ================================================
echo.

:: PRE-FLIGHT: Cleanup Expo and Next.js state to prevent collisions/caching
echo [SYSTEM] Performing Deep Clean (Cleaning Cache)...
if exist "C:\Users\acer\.expo\state.json" del /f /q "C:\Users\acer\.expo\state.json" >nul 2>&1
if exist "apps\admin\.next" rmdir /s /q "apps\admin\.next" >nul 2>&1
echo          Environment Cleared.

:: Step 1: Core Infrastructure (Database)
echo [1/4] Starting Global Database...
call docker-compose up -d >nul 2>&1
echo          Database Active.
timeout /t 3 /nobreak >nul

:: Step 2: Prisma Logic
echo [2/4] Synchronizing Data Mesh...
SET "DATABASE_URL=postgresql://postgres:password@localhost:5432/drinkanddrive"
call npx prisma generate --schema packages/db/prisma/schema.prisma >nul 2>&1
echo          Prisma Synchronized.

:: Step 3: Launch Web Infrastructure & Open Browser
echo [3/4] Launching Cloud Infrastructure...
START "DriveSafe BACKEND" cmd /k "cd /d "%PROJECT_DIR%" && title [BACKEND] && call npm run backend:dev"
timeout /t 3 /nobreak >nul
START "DriveSafe ADMIN"   cmd /k "cd /d "%PROJECT_DIR%" && title [ADMIN] && call npm run admin:dev"

:: LAUNCH BROWSER IMMEDIATELY
echo          Opening Admin Dashboard...
timeout /t 5 /nobreak >nul
START http://localhost:3000

:: Step 4: Mobile Stacks (Staggered for safety)
echo [4/4] Orchestrating Mobile Applications...
START "DriveSafe RIDER"   cmd /k "cd /d "%PROJECT_DIR%" && title [RIDER] && call npm run rider:dev"

echo          Initializing Driver Neural Link (8s)...
timeout /t 8 /nobreak >nul
START "DriveSafe DRIVER"  cmd /k "cd /d "%PROJECT_DIR%" && title [DRIVER] && call npm run driver:dev"

echo.
echo  ================================================
echo    DRIVESAFE IS NOW LIVE IN YOUR BROWSER!
echo  ================================================
echo.
echo    ADMIN PANEL:  http://localhost:3000
echo    HEALTH:       http://localhost:4000/health
echo.
echo  ================================================
echo.

pause
