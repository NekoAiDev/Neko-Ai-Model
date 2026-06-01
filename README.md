# 🐱 Neko Ai 猫娘模型

智能猫娘 AI 聊天服务 — 用你自己的 API 驱动一个可爱的猫娘助手。

## ✨ 功能

- 🎭 **四种猫娘性格** — 默认 / 傲娇 / 甜心 / 慵懒，还可自定义
- 💬 **微信风格聊天** — 用户右 / 机器人左，支持表情、图片、文件
- 📚 **知识库** — 添加自定义知识，猫娘会参考回答
- 🎨 **精美暗色 UI** — 粉紫猫娘主题，自适应手机
- ⚡ **流式输出** — 打字动画效果
- 🔄 **自动更新** — 检查 GitHub 最新版本，一键更新
- 🏠 **首次命名** — 初次使用可给猫娘取名字

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/NekoAiDev/Neko-Ai-Model.git
cd Neko-Ai-Model

# 2. 安装依赖
npm install

# 3. 启动服务（默认端口 8085）
# Linux/macOS:
./start.sh

# Windows:
start.bat

# 或直接用 npm:
npm start
```

打开浏览器访问 `http://localhost:8085`，配置 API 即可使用。

## 🔧 命令行

```bash
# 启动服务
neko model start

# 或
./start.sh
```

## 🔑 API 配置

支持所有兼容 OpenAI 格式的 API，例如：
- OpenAI: `https://api.openai.com/v1`
- 国内中转 API
- 本地部署的模型（Ollama 等）

## 📸 截图

![界面预览](screenshot.png)

## 👥 团队

- **作者**：小红蛋
- **团队**：Neko Ai
- **组织**：[NekoAiDev](https://github.com/NekoAiDev)

## 📄 协议

MIT License
