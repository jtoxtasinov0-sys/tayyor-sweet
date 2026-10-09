@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Backend (bot + API) :4000 va mini ilova :3000 ishga tushmoqda...
start "Tayyor & Sweet - backend" /D "%~dp0backend" cmd /k npm start
start "Tayyor & Sweet - miniapp" /D "%~dp0miniapp" cmd /k npm run dev
timeout /t 8 >nul
start "" http://localhost:3000
start "" http://localhost:3000/admin
