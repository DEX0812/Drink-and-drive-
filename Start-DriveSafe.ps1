# 🏙️ DriveSafe Platform One-Click Startup Script (Windows PowerShell)

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = $PSScriptRoot

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   🚀 STARTING THE DRIVESAFE PLATFORM..." -ForegroundColor Cyan
Write-Host "   Location: $PROJECT_ROOT" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 1. Dependency Check
if (!(Test-Path "$PROJECT_ROOT\node_modules")) {
    Write-Host "[1/4] Installing platform dependencies..." -ForegroundColor Yellow
    Set-Location $PROJECT_ROOT
    npm install
} else {
    Write-Host "[1/5] Checking Infrastructure..." -ForegroundColor Cyan
    try {
        docker-compose up -d
    } catch {
        Write-Host "[WARNING] Docker not found or failed to start. Ensure PostgreSQL is running manually." -ForegroundColor Yellow
    }

    Write-Host "[2/5] Dependencies already installed. Skipping." -ForegroundColor Cyan
}

# 2. Database Sync
Write-Host "[2/5] Running Prisma migrations & client generation..." -ForegroundColor Cyan
Invoke-Expression "npm run db:migrate"
Invoke-Expression "npx prisma generate --schema packages/db/prisma/schema.prisma"

# 3. Launching Services (Concurrent)
Write-Host "[3/4] Launching Dev Servers in separate windows..." -ForegroundColor Yellow
Write-Host "      (Please keep these windows open)" -ForegroundColor Cyan

# Launch Function to handle quoting and paths
function Launch-Service($Name, $Command) {
    $Args = "-NoExit -Command `'cd ""$PROJECT_ROOT""; $Command`'"
    Start-Process powershell -ArgumentList $Args -Title "DriveSafe - $Name"
}

Launch-Service "BACKEND" "npm run backend:dev"
Launch-Service "RIDER APP" "npm run rider:dev"
Launch-Service "DRIVER APP" "npm run driver:dev"
Launch-Service "ADMIN DASHBOARD" "npm run admin:dev"

Write-Host "[4/4] ALL SERVICES LAUNCHED." -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "   🔥 DRIVESAFE IS READY. OPENING ADMIN DASHBOARD..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

Start-Process "http://localhost:3000"
