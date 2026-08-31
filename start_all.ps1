$ErrorActionPreference = "Stop"

$root = $PSScriptRoot

Write-Host "Installing dependencies..."

Set-Location "$root\frontend\admin-dashboard"
npm install

Set-Location "$root\frontend\citizen-portal"
npm install

Set-Location "$root\services\api"
npm install

Set-Location "$root\services\estimation"
py -m pip install -r requirements.txt
py -m pip install uvicorn

Write-Host "Starting all services..."

# Admin Dashboard — port 3000
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$root\frontend\admin-dashboard'; npm run dev -- --port 3000`"" -WindowStyle Normal

# Citizen Portal — port 3001
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$root\frontend\citizen-portal'; npm run dev -- --port 3001`"" -WindowStyle Normal

# Node API (core-api) — default port
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$root\services\api'; node src/index.js`"" -WindowStyle Normal

# Estimation Service (FastAPI) — port 8000
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$root\services\estimation'; py main.py`"" -WindowStyle Normal

Write-Host "All services started:"
Write-Host "  Admin Dashboard  -> http://localhost:3000"
Write-Host "  Citizen Portal   -> http://localhost:3001"
Write-Host "  Estimation API   -> http://localhost:8000"
Write-Host "  Estimation Docs  -> http://localhost:8000/docs"
