# ==============================================================================
# GP-01: Air Quality Platform - One-Click Launcher
# Launches ML Backend (8000), Node Gateway (5000), and Next.js Web (3000)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Launching GP-01 Air Quality Intelligence Platform... " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Python FastAPI ML Backend
Write-Host "[1/3] Starting ML Backend (FastAPI on Port 8000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'S:\Diwali_hack\apps\ml-service'; Write-Host '--- ML Service (FastAPI) ---' -ForegroundColor Green; .\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# 2. Start Node.js API Gateway
Start-Sleep -Seconds 2
Write-Host "[2/3] Starting Node.js API Gateway (Express on Port 5000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'S:\Diwali_hack\apps\api-node'; Write-Host '--- Node.js API Gateway ---' -ForegroundColor Green; npm run dev"

# 3. Start Next.js Frontend Dashboard
Start-Sleep -Seconds 2
Write-Host "[3/3] Starting Web Dashboard (Next.js on Port 3000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'S:\Diwali_hack\apps\web'; Write-Host '--- Next.js Dashboard ---' -ForegroundColor Green; npm run dev"

Write-Host "`nAll 3 services have been launched in separate terminal windows!" -ForegroundColor Green
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  💻 Frontend Dashboard:   http://localhost:3000" -ForegroundColor Yellow
Write-Host "  📡 Node.js REST API:     http://localhost:5000/api/v1" -ForegroundColor Yellow
Write-Host "  🧠 ML FastAPI Swagger:   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
