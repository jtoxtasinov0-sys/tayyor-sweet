@echo off
chcp 65001 >nul
title Tayyor ^& Sweet - ornatish
cd /d "%~dp0"
echo [1/3] Backend paketlari...
call npm install --prefix backend
echo [2/3] Mini ilova paketlari...
call npm install --prefix miniapp
echo [3/3] Baza va 24 ta mahsulot (rasmlar papkasidan)...
call npm run seed --prefix backend
echo.
echo Tayyor! Endi 2_start.bat ni ishga tushiring.
pause
