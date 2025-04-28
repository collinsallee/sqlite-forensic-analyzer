@echo off
echo Starting SQLite Forensic Artifact Analyzer with fixed file ID handling...

echo Starting backend server...
start cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start cmd /k "cd app && npm run dev"

echo Both servers started!
echo Backend available at: http://localhost:8000
echo Frontend available at: http://localhost:3000
echo.
echo Use these URLs to access the application. 