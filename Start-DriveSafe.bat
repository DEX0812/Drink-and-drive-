@echo off
SETLOCAL EnableDelayedExpansion
TITLE DriveSafe Platform Master Starter

:: Get the directory where the script is located, safely quoted
SET "PROJECT_DIR=%~dp0"
CD /D "%PROJECT_DIR%"

echo --------------------------------------------------------
echo    🚀 STARTING THE DRIVESAFE PLATFORM...
echo    Location: %PROJECT_DIR%
echo --------------------------------------------------------

:: 1. Dependency Check
if not exist "node_modules" (
    echo [1/4] Installing platform dependencies...
    call npm install
) else (
    echo [1/5] Checking Infrastructure...
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Docker not found or failed to start. Ensure PostgreSQL is running manually.
)

echo [2/5] Dependencies already installed. Skipping.
)

:: 2. Database Sync
echo [2/5] Running Prisma migrations & client generation...
call npm run db:migrate
call npx prisma generate --schema packages/db/prisma/schema.prisma

:: 3. Launching Services
echo [3/4] Launching Dev Servers in separate windows...
echo       (Please keep these windows open)

START "DriveSafe - BACKEND" cmd /k "cd /d "%PROJECT_DIR%" && npm run backend:dev"
START "DriveSafe - RIDER APP" cmd /k "cd /d "%PROJECT_DIR%" && npm run rider:dev"
START "DriveSafe - DRIVER APP" cmd /k "cd /d "%PROJECT_DIR%" && npm run driver:dev"
START "DriveSafe - ADMIN DASHBOARD" cmd /k "cd /d "%PROJECT_DIR%" && npm run admin:dev"

echo [4/4] ALL SERVICES LAUNCHED.
echo --------------------------------------------------------
echo    🔥 DRIVESAFE IS READY. OPENING ADMIN DASHBOARD...
echo --------------------------------------------------------
START http://localhost:3000
pause
