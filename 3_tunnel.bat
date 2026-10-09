@echo off
chcp 65001 >nul
title Tayyor ^& Sweet - tunnel
echo Telefonda (Telegram ichida) sinash uchun https manzil olinadi.
echo Chiqqan https://....trycloudflare.com manzilini backend\.env dagi MINIAPP_URL ga yozing
echo va backend oynasini qayta ishga tushiring (2_start.bat).
echo.
where cloudflared >nul 2>nul || (echo cloudflared topilmadi: winget install Cloudflare.cloudflared & pause & exit /b)
cloudflared tunnel --url http://localhost:3000
