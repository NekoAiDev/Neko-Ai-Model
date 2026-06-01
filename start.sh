#!/bin/bash
# Neko Model Start - 猫娘 AI 启动脚本
# 作者: 小红蛋 | 团队: Neko Ai

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   🐱  Neko Model Start                       ║"
echo "║   正在启动猫娘 AI 服务...                      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js (https://nodejs.org)"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install --production
    echo ""
fi

# 检查端口占用
if command -v lsof &> /dev/null; then
    if lsof -Pi :8085 -sTCP:LISTEN -t &> /dev/null; then
        echo "⚠️  端口 8085 已被占用，正在释放..."
        lsof -ti:8085 | xargs kill -9 2>/dev/null
        sleep 1
    fi
fi

echo "🚀 启动 Neko Ai Model 服务..."
echo ""
node server.js
