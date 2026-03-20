/**
 * 前端集成服务器 (ES Module版本)
 * 同时提供静态文件服务、地图代理和WebSocket代理功能
 * 解决HTTPS混合内容问题
 */
import express from 'express';
import http from 'http';
import pkg from 'http-proxy';
const { createProxyServer } = pkg;
import path from 'path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const MAP_TARGET = process.env.MAP_TARGET || 'http://1.14.100.199:8888';
const WS_TARGET = process.env.WS_TARGET || 'ws://1.14.100.199:8050';
const PORT = 5000;
const STATIC_DIR = path.join(__dirname, 'dist');

// 注入到地图HTML的脚本（初始化callbackObj）
const CALLBACK_INJECT_SCRIPT = `
<script>
// 由代理服务器注入：初始化 callbackObj 支持 Web 模式
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

// 创建Express应用
const app = express();

// 创建代理服务器
const proxy = createProxyServer({
  target: MAP_TARGET,
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  selfHandleResponse: true // 自行处理响应
});

// 代理错误处理
proxy.on('error', (err, req, res) => {
  console.error('[MapProxy] 代理错误:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
  }
});

// 代理请求日志
proxy.on('proxyReq', (proxyReq, req, res) => {
  console.log(`[MapProxy] ${req.method} ${req.url} -> ${MAP_TARGET}${req.url}`);
});

// 代理响应处理：注入脚本到HTML
proxy.on('proxyRes', (proxyRes, req, res) => {
  const contentType = proxyRes.headers['content-type'] || '';
  const url = req.url || '';
  
  // 使用 URL 扩展名作为主要判断（更可靠）
  const isHtmlFile = url.endsWith('.html') || url.endsWith('.htm') || url === '' || url.endsWith('/');
  const isHtmlContentType = contentType.includes('text/html');
  
  // 只有明确是 HTML 文件才注入
  if (isHtmlFile && isHtmlContentType) {
    const chunks = [];
    
    proxyRes.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    proxyRes.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        let body = buffer.toString('utf8');
        
        body = body.replace(/<head[^>]*>/i, '<head>' + CALLBACK_INJECT_SCRIPT);
        console.log('[MapProxy] 已注入 callbackObj 脚本到:', url);
        
        // 设置响应头
        const headers = { ...proxyRes.headers };
        delete headers['content-length'];
        headers['content-length'] = Buffer.byteLength(body);
        
        res.writeHead(proxyRes.statusCode, headers);
        res.end(body);
      } catch (e) {
        console.error('[MapProxy] 处理响应失败:', e.message);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
  } else {
    // 非HTML文件直接流式传输
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }
});

// CORS 头设置（所有请求）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 地图服务代理路由（优先级最高）
app.use('/map-service', (req, res) => {
  const originalUrl = req.url;
  req.url = req.url.replace('/map-service', '');
  proxy.web(req, res);
});

// 创建HTTP服务器
const server = http.createServer(app);

// WebSocket 代理功能
const wss = new WebSocketServer({ noServer: true });

// 存储活跃的 WebSocket 连接
const wsClients = new Map();

// WebSocket 连接处理
wss.on('connection', async (ws, req) => {
  console.log('[WSProxy] 新的 WebSocket 客户端连接');
  
  // 提取路径
  const url = req.url || '/ws';
  const targetPath = url;
  console.log(`[WSProxy] 代理 WebSocket: ${url} -> ${WS_TARGET}`);
  
  // 使用 HTTP Upgrade 方式连接到目标 WebSocket 服务器
  const isSecure = WS_TARGET.startsWith('wss://');
  const netModule = isSecure ? await import('https') : await import('http');
  
  // 解析目标 URL
  const targetUrlObj = new URL(WS_TARGET);
  
  const options = {
    hostname: targetUrlObj.hostname,
    port: targetUrlObj.port || (isSecure ? 443 : 80),
    path: targetPath,
    method: 'GET',
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Key': generateWebSocketKey(),
      'Sec-WebSocket-Version': '13'
    }
  };
  
  console.log(`[WSProxy] 连接到目标: ${options.hostname}:${options.port}${options.path}`);
  
  const upgradeReq = netModule.request(options, (res) => {
    console.log(`[WSProxy] 目标响应状态: ${res.statusCode}`);
    if (res.statusCode === 101) {
      // 升级成功，开始双向转发
      setupWebSocketProxy(ws, res.socket);
    } else {
      console.error('[WSProxy] 目标服务器未接受 WebSocket 升级');
      ws.close(1011, 'Target rejected WebSocket upgrade');
    }
  });
  
  upgradeReq.on('error', (error) => {
    console.error('[WSProxy] 连接目标服务器失败:', error.message);
    ws.close(1011, 'Failed to connect to target');
  });
  
  upgradeReq.end();
});

// WebSocket 代理设置
function setupWebSocketProxy(clientWs, targetSocket) {
  console.log('[WSProxy] WebSocket 代理已建立');
  
  // 客户端 -> 服务器
  clientWs.on('message', (message) => {
    console.log(`[WSProxy] 客户端 -> 服务器: ${message.toString().substring(0, 50)}...`);
    try {
      targetSocket.write(message);
    } catch (e) {
      console.error('[WSProxy] 发送失败:', e.message);
    }
  });
  
  // 服务器 -> 客户端
  targetSocket.on('data', (chunk) => {
    try {
      // WebSocket 帧需要特殊处理
      const wsFrame = createWebSocketFrame(chunk);
      clientWs.send(wsFrame);
    } catch (e) {
      console.error('[WSProxy] 发送失败:', e.message);
    }
  });
  
  // 客户端关闭
  clientWs.on('close', (code, reason) => {
    console.log(`[WSProxy] 客户端连接关闭: ${code} ${reason}`);
    try {
      targetSocket.destroy();
    } catch (e) {}
  });
  
  // 服务器关闭
  targetSocket.on('close', () => {
    console.log('[WSProxy] 目标服务器连接关闭');
    try {
      clientWs.close();
    } catch (e) {}
  });
  
  // 错误处理
  clientWs.on('error', (error) => {
    console.error('[WSProxy] 客户端错误:', error.message);
  });
  
  targetSocket.on('error', (error) => {
    console.error('[WSProxy] 目标连接错误:', error.message);
  });
}

// 生成 WebSocket 握手密钥
function generateWebSocketKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return Buffer.from(key).toString('base64');
}

// 创建 WebSocket 二进制帧 (simplified)
// 注意：实际生产中应使用 ws 库的 mask 逻辑
function createWebSocketFrame(data) {
  // 简单转发，不做额外处理
  return data;
}

// 处理 HTTP 升级请求
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  
  if (pathname === '/ws' || pathname.startsWith('/ws')) {
    console.log(`[WSProxy] 收到 WebSocket 升级请求: ${pathname}`);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// 静态文件服务
app.use(express.static(STATIC_DIR, {
  maxAge: '1h',
  etag: true
}));

// SPA回退路由 - 禁用index.html缓存
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log('========================================');
  console.log('[Frontend Server] 服务器已启动');
  console.log(`[Frontend Server] 端口: ${PORT}`);
  console.log(`[Frontend Server] 静态文件目录: ${STATIC_DIR}`);
  console.log(`[MapProxy] 目标: ${MAP_TARGET}`);
  console.log(`[MapProxy] 代理路径: /map-service -> ${MAP_TARGET}`);
  console.log(`[WSProxy] WebSocket 代理: /ws -> ${WS_TARGET}`);
  console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[Server] 收到SIGTERM信号，关闭服务器...');
  
  // 关闭所有 WebSocket 连接
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('[Server] 服务器已关闭');
    process.exit(0);
  });
});
