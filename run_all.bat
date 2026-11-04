@echo off
title GP-01 Air Quality Intelligence Platform Launcher
echo ==========================================================
echo  Launching GP-01 Air Quality Intelligence Platform...
echo ==========================================================

echo [1/3] Starting Python ML FastAPI Service (Port 8000)...
start "GP-01 ML Service" cmd /k "cd /d S:\Diwali_hack\apps\ml-service && .\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul
echo [2/3] Starting Node.js API Gateway (Port 5000)...
start "GP-01 Node API Gateway" cmd /k "cd /d S:\Diwali_hack\apps\api-node && npm run dev"

timeout /t 2 >nul
echo [3/3] Starting Next.js Web Dashboard (Port 3000)...
start "GP-01 Web Dashboard" cmd /k "cd /d S:\Diwali_hack\apps\web && npm run dev"

echo.
echo All 3 services are running!
echo ----------------------------------------------------------
echo   Frontend Dashboard:   http://localhost:3000
echo   Node.js Gateway:      http://localhost:5000/api/v1
echo   FastAPI ML Docs:      http://localhost:8000/docs
echo ----------------------------------------------------------
pause
