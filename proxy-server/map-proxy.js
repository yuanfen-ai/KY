/**
 * 地图服务代理服务器
 * 用于解决HTTPS混合内容问题，将HTTP地图服务代理为HTTPS
 */
const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const express = require('express');
const path = require('path');

// 地图服务目标地址
const MAP_TARGET = process.env.MAP_TARGET || 'http://1.14.100.199:8888';
const PORT = process.env.MAP_PROXY_PORT || 3001;

// 创建Express应用
const app = express();

// 创建代理服务器
const proxy = httpProxy.createProxyServer({
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

// CORS 头设置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 地图服务代理路由
app.use('/map-service', (req, res) => {
  // 重写URL，移除/map-service前缀
  req.url = req.url.replace('/map-service', '');
  proxy.web(req, res, { target: MAP_TARGET });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: MAP_TARGET });
});

// 创建HTTP服务器
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[MapProxy] 地图代理服务器已启动`);
  console.log(`[MapProxy] 端口: ${PORT}`);
  console.log(`[MapProxy] 目标: ${MAP_TARGET}`);
  console.log(`[MapProxy] 代理路径: /map-service -> ${MAP_TARGET}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[MapProxy] 收到SIGTERM信号，关闭服务器...');
  server.close(() => {
    console.log('[MapProxy] 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[MapProxy] 收到SIGINT信号，关闭服务器...');
  server.close(() => {
    console.log('[MapProxy] 服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, server, proxy };
