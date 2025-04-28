@echo off
echo Starting SQLite Forensic Artifact Analyzer...

echo Starting backend server...
start cmd /k "cd backend && python -m uvicorn app.main:app --reload"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting frontend...
cd app && npm run dev

echo Application started! 
echo Backend available at: http://localhost:8000
echo Frontend available at: http://localhost:3000 