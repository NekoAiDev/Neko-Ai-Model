#!/usr/bin/env node
/**
 * Neko Ai Model - 猫娘 AI 服务端
 * 作者: 小红蛋 | 团队: Neko Ai
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 8085;

// 配置存储路径
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 工具函数 ====================
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ==================== API 路由 ====================

// 获取配置
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  // 不返回敏感信息
  const safe = { ...config };
  if (safe.apiKey) safe.apiKey = safe.apiKey.slice(0, 4) + '***' + safe.apiKey.slice(-4);
  res.json({ success: true, data: safe });
});

// 保存配置
app.post('/api/config', (req, res) => {
  const config = loadConfig();
  const newConfig = { ...config, ...req.body };
  saveConfig(newConfig);
  res.json({ success: true, message: '配置已保存' });
});

// 聊天代理 (解决跨域)
app.post('/api/chat', async (req, res) => {
  const config = loadConfig();
  if (!config.apiBase || !config.apiKey || !config.model) {
    return res.status(400).json({ success: false, error: '请先配置 API' });
  }

  const { messages, stream = false } = req.body;
  const apiUrl = config.apiBase.replace(/\/+$/, '') + '/chat/completions';

  try {
    const url = new URL(apiUrl);
    const client = url.protocol === 'https:' ? https : http;

    const postData = JSON.stringify({
      model: config.model,
      messages: messages,
      stream: stream,
      temperature: 0.9,
      max_tokens: 2048
    });

    if (stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const apiReq = client.request(options, (apiRes) => {
        if (apiRes.statusCode !== 200) {
          let body = '';
          apiRes.on('data', chunk => body += chunk);
          apiRes.on('end', () => {
            res.write(`data: ${JSON.stringify({ error: `API 返回错误 (HTTP ${apiRes.statusCode}): ${body}` })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          });
          return;
        }
        apiRes.pipe(res);
      });

      apiReq.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ error: `请求失败: ${err.message}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });

      apiReq.write(postData);
      apiReq.end();
    } else {
      // 非流式响应
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const apiReq = client.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (apiRes.statusCode === 200) {
              res.json({ success: true, data });
            } else {
              res.status(apiRes.statusCode).json({
                success: false,
                error: data.error?.message || `API 返回错误 (HTTP ${apiRes.statusCode})`
              });
            }
          } catch (e) {
            res.status(500).json({ success: false, error: '解析 API 响应失败' });
          }
        });
      });

      apiReq.on('error', (err) => {
        res.status(500).json({ success: false, error: `请求失败: ${err.message}` });
      });

      apiReq.write(postData);
      apiReq.end();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: `请求失败: ${err.message}` });
  }
});

// 版本信息
app.get('/api/version', (req, res) => {
  const pkg = require('./package.json');
  res.json({
    success: true,
    data: {
      version: pkg.version,
      name: pkg.name,
      description: pkg.description
    }
  });
});

// GitHub 组织信息
app.get('/api/github/org', async (req, res) => {
  try {
    const data = await githubRequest('/orgs/NekoAiDev');
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// GitHub 仓库信息
app.get('/api/github/repo', async (req, res) => {
  try {
    const data = await githubRequest('/repos/NekoAiDev/Neko-Ai-Model');
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// GitHub 贡献者
app.get('/api/github/contributors', async (req, res) => {
  try {
    const data = await githubRequest('/repos/NekoAiDev/Neko-Ai-Model/contributors');
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 检查最新版本
app.get('/api/github/latest', async (req, res) => {
  try {
    const pkg = require('./package.json');
    const currentVersion = pkg.version;

    // 获取最新 release
    const releases = await githubRequest('/repos/NekoAiDev/Neko-Ai-Model/releases?per_page=1');

    let latestVersion = currentVersion;
    let latestTag = '';
    let isLatest = true;
    let releaseUrl = '';

    if (releases && releases.length > 0) {
      latestTag = releases[0].tag_name || '';
      latestVersion = latestTag.replace(/^v/, '');
      releaseUrl = releases[0].html_url || '';
      isLatest = compareVersions(currentVersion, latestVersion) >= 0;
    }

    // 如果没 release，检查最新 commit
    if (!releases || releases.length === 0) {
      const commits = await githubRequest('/repos/NekoAiDev/Neko-Ai-Model/commits?per_page=1');
      if (commits && commits.length > 0) {
        latestTag = commits[0].sha?.slice(0, 7) || '';
        releaseUrl = commits[0].html_url || '';
        // 检查本地 commit hash
        try {
          const localHash = require('child_process')
            .execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
          isLatest = localHash === latestTag || commits[0].sha === localHash;
        } catch (e) {
          isLatest = true;
        }
      }
    }

    res.json({
      success: true,
      data: {
        currentVersion,
        latestVersion,
        latestTag,
        isLatest,
        releaseUrl,
        needUpdate: !isLatest
      }
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// 自动更新
app.post('/api/update', (req, res) => {
  const { execSync } = require('child_process');
  try {
    console.log('📦 正在拉取最新版本...');
    const output = execSync('git fetch origin && git reset --hard origin/master 2>&1 || git pull origin master 2>&1', {
      encoding: 'utf-8',
      cwd: __dirname,
      timeout: 30000
    });
    // 重新安装依赖
    execSync('npm install --production 2>&1', {
      encoding: 'utf-8',
      cwd: __dirname,
      timeout: 60000
    });
    res.json({ success: true, message: '更新成功！请重启服务器', output });
  } catch (err) {
    res.json({ success: false, error: '更新失败: ' + (err.stderr || err.message) });
  }
});

// GitHub API 请求
function githubRequest(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: 'GET',
      headers: {
        'User-Agent': 'Neko-Ai-Model/1.0',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('解析 GitHub 响应失败'));
        }
      });
    }).on('error', reject);
  });
}

// 版本比较
function compareVersions(v1, v2) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// 文档页面路由
app.use('/docs', express.static(path.join(__dirname, 'public', 'docs')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 启动 ====================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🐱  Neko Ai Model 猫娘 AI 已启动           ║');
  console.log('║                                              ║');
  console.log(`║   地址: http://localhost:${PORT}                 ║`);
  console.log('║   版本: ' + require('./package.json').version + '                              ║');
  console.log('║   作者: 小红蛋 | Neko Ai                      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});
