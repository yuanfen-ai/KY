/**
 * 前端集成服务器 (ES Module版本)
 * 同时提供静态文件服务和地图代理功能
 * 解决HTTPS混合内容问题
 */
import express from 'express';
import { createProxyServer } from 'http-proxy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const MAP_TARGET = process.env.MAP_TARGET || 'http://1.14.100.199:8888';
const PORT = process.env.PORT || 5000;
const STATIC_DIR = path.join(__dirname, 'dist');

// 创建Express应用
const app = express();

// 创建代理服务器
const proxy = createProxyServer({
  target: MAP_TARGET,
  changeOrigin: true,
  secure: false,
  followRedirects: true
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
  console.log(`[MapProxy] 代理请求: ${originalUrl} -> ${MAP_TARGET}${req.url}`);
  proxy.web(req, res, { target: MAP_TARGET });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: MAP_TARGET, static: STATIC_DIR });
});

// 静态文件服务
app.use(express.static(STATIC_DIR, {
  maxAge: '1d',
  etag: true
}));

// SPA回退路由 - 所有未匹配的路由返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('[Frontend Server] 服务器已启动');
  console.log(`[Frontend Server] 端口: ${PORT}`);
  console.log(`[Frontend Server] 静态文件目录: ${STATIC_DIR}`);
  console.log(`[MapProxy] 目标: ${MAP_TARGET}`);
  console.log(`[MapProxy] 代理路径: /map-service -> ${MAP_TARGET}`);
  console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[Server] 收到SIGTERM信号，关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] 收到SIGINT信号，关闭服务器...');
  process.exit(0);
});

export default app;
