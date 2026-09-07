@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 22 or later is required. See README.md.
 pause
 exit /b 1
)
start "" http://localhost:4175
node tools/serve.mjs
pause
