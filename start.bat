@echo off
chcp 65001 >nul
title Neko Ai Model - 猫娘 AI
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   🐱  Neko Model Start                       ║
echo ║   正在启动猫娘 AI 服务...                      ║
echo ╚══════════════════════════════════════════════╝
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    call npm install --production
    echo.
)

echo 🚀 启动 Neko Ai Model 服务...
echo.
node server.js
pause
