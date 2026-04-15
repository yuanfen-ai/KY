/**
 * 前端集成服务器
 * - 静态文件服务（dist/）
 * - 地图服务代理（/map-service → 远程地图服务）
 * - WebSocket 代理（/ws → 远程设备服务）
 *
 * 远程地址通过环境变量配置，代码中提供默认值
 */

import express from 'express';
import http from 'http';
import pkg from 'http-proxy';
const { createProxyServer } = pkg;
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 配置 ====================

const MAP_TARGET = process.env.MAP_TARGET || 'http://1.14.100.199:8888';
const WS_TARGET = process.env.WS_TARGET || 'ws://1.14.100.199:8050';
const PORT = process.env.DEPLOY_RUN_PORT || process.env.PORT || 5000;
const STATIC_DIR = path.join(__dirname, 'dist');

console.log('=========================================');
console.log(`[Config] 地图代理: ${MAP_TARGET}`);
console.log(`[Config] WS代理:   ${WS_TARGET}`);
console.log('=========================================');

// ==================== 工具函数 ====================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 地图代理 ====================

// 注入到地图 HTML 的脚本（初始化 callbackObj，实现 iframe 通信）
const CALLBACK_INJECT_SCRIPT = `
<script>
(function() {
  var callbackMethods = ['loadComplete', 'selectOther', 'selectRight_ClickOther', 'onLocationSelected', 'mouseLocation'];
  window.callbackObj = window.callbackObj || {};
  callbackMethods.forEach(function(methodName) {
    if (!window.callbackObj[methodName]) {
      window.callbackObj[methodName] = function() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'CALLBACK_' + methodName,
            args: Array.from(arguments)
          }, '*');
        }
      };
    }
  });
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (data && data.type === 'INIT_CALLBACK' && data.methods) {
      data.methods.forEach(function(methodName) {
        if (!window.callbackObj[methodName]) {
          window.callbackObj[methodName] = function() {
            window.parent.postMessage({
              type: 'CALLBACK_' + methodName,
              args: Array.from(arguments)
            }, '*');
          };
        }
      });
    }
  });
  window.addEventListener('load', function() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'MAP_LOADED' }, '*');
    }
  });
})();
</script>
`;

const app = express();

const proxy = createProxyServer({
  target: MAP_TARGET,
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  selfHandleResponse: true
});

proxy.on('error', (err, req, res) => {
  console.error('[MapProxy] 代理错误:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
  }
});

// 地图 HTML 响应注入 callbackObj 脚本
proxy.on('proxyRes', (proxyRes, req, res) => {
  const contentType = proxyRes.headers['content-type'] || '';
  const url = req.url || '';
  const isHtml = (url.endsWith('.html') || url.endsWith('.htm') || url === '' || url.endsWith('/'))
    && contentType.includes('text/html');

  if (isHtml) {
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8').replace(/<head[^>]*>/i, '<head>' + CALLBACK_INJECT_SCRIPT);
        const headers = { ...proxyRes.headers, 'content-length': Buffer.byteLength(body) };
        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      } catch (e) {
        console.error('[MapProxy] 处理响应失败:', e.message);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  } else {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 地图代理路由
app.use('/map-service', (req, res) => {
  req.url = req.url.replace('/map-service', '');
  proxy.web(req, res);
});

// ==================== WebSocket 代理 ====================

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (clientWs, req) => {
  const targetUrl = `${WS_TARGET}${req.url || '/ws'}`;
  console.log(`[WS-Proxy] 客户端连接 → ${targetUrl}`);

  const messageQueue = [];
  let isTargetReady = false;
  const targetWs = new WebSocket(targetUrl);

  targetWs.on('open', () => {
    console.log('[WS-Proxy] 目标服务器连接成功');
    isTargetReady = true;
    // 发送缓存的消息
    while (messageQueue.length > 0 && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(messageQueue.shift());
    }
  });

  // 客户端 → 目标
  clientWs.on('message', (data) => {
    const msg = data.toString();
    if (isTargetReady && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(msg);
    } else {
      messageQueue.push(msg);
    }
  });

  // 目标 → 客户端
  targetWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  // 双向关闭联动
  clientWs.on('close', () => { if (targetWs.readyState === WebSocket.OPEN) targetWs.close(); });
  targetWs.on('close', () => { if (clientWs.readyState === WebSocket.OPEN) clientWs.close(); });

  // 错误处理
  clientWs.on('error', (err) => console.error('[WS-Proxy] 客户端错误:', err.message));
  targetWs.on('error', (err) => {
    console.error('[WS-Proxy] 目标服务器错误:', err.message);
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, 'Target server error');
  });
});

// ==================== HTTP 服务器 ====================

const server = http.createServer(app);

// WebSocket 升级请求
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/ws' || pathname.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
  } else {
    socket.destroy();
  }
});

// 静态文件（禁用缓存）
app.use(express.static(STATIC_DIR, {
  maxAge: 0, etag: false, lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// SPA 回退
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ==================== 端口检测与启动 ====================

const checkAndReleasePort = (port) => {
  try {
    const output = execSync(`ss -lptn 'sport = :${port}' 2>/dev/null`, { encoding: 'utf-8' });
    const pidMatch = output.match(/pid=(\d+)/);
    if (pidMatch) {
      const pid = parseInt(pidMatch[1]);
      console.log(`[Server] 端口 ${port} 被进程 PID:${pid} 占用，正在终止...`);
      process.kill(pid, 'SIGKILL');
      return sleep(1500).then(() => console.log(`[Server] 端口 ${port} 已释放`));
    }
  } catch {
    // 端口未被占用
  }
  return Promise.resolve();
};

const startServer = async () => {
  await checkAndReleasePort(PORT);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[Server] 端口 ${PORT} 被占用，请检查后重试`);
    } else {
      console.error('[Server] 服务器错误:', error);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log('=========================================');
    console.log(`[Server] 已启动  端口:${PORT}`);
    console.log(`[MapProxy] /map-service → ${MAP_TARGET}`);
    console.log(`[WS-Proxy] /ws → ${WS_TARGET}`);
    console.log('=========================================');
  });
};

startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[Server] 收到关闭信号');
  server.close(() => process.exit(0));
});
