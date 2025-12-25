@echo off
setlocal

echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/2] Starting PM2 (Backend + Frontend Dev)...
call npx pm2 start ecosystem.config.js
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo ===================================================
echo Gridcore started successfully!
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo Use 'npx pm2 logs' to view logs.
echo Use 'npx pm2 status' to view status.
echo ===================================================
pause
