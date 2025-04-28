@echo off
echo Starting SQLite Forensic Artifact Analyzer with CORS and fetch URL fixes...

echo Killing any existing processes on ports 8000 and 3000/3001...
for /f "tokens=5" %%p in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
  taskkill /F /PID %%p 2>nul
)
for /f "tokens=5" %%p in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
  taskkill /F /PID %%p 2>nul
)
for /f "tokens=5" %%p in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
  taskkill /F /PID %%p 2>nul
)

echo Starting backend server on port 8000...
start cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting frontend on port 3000...
start cmd /k "cd app && npm run dev -- --port 3000"

echo All servers started!
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: http://localhost:3000
echo.
echo IMPORTANT: Make sure to use the "Check File Exists" button on the Hex Editor tab
echo to verify the file has been properly uploaded and stored on the server.
echo. 