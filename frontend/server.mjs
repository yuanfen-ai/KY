#!/usr/bin/env node
/**
 * 简单的静态文件服务器
 * 用于在沙箱环境中提供前端预览
 * 避免使用Vite的HMR功能，解决HTTPS环境下的SecurityError
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';

const PORT = 5000;
const HOST = '0.0.0.0';
const DIST_DIR = join(process.cwd(), 'frontend', 'dist');

// MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  const stats = statSync(filePath);
  const mimeType = getMimeType(filePath);

  try {
    const content = readFileSync(filePath);

    // 为HTML文件添加更强的缓存控制
    if (filePath.endsWith('.html')) {
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
    } else {
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Cache-Control': 'no-cache',
      });
    }

    res.end(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
}

function serveIndexHtml(res) {
  const filePath = join(DIST_DIR, 'index.html');

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('index.html not found');
    return;
  }

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': content.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    });
    res.end(content);
  } catch (error) {
    console.error('Error reading index.html:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
}

const server = createServer((req, res) => {
  // 记录请求
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理健康检查请求
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  // 处理根路径的重定向
  if (req.url === '/') {
    serveIndexHtml(res);
    return;
  }

  // 只处理GET请求
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed');
    return;
  }

  const parsedUrl = parse(req.url || '/', true);
  let pathname = parsedUrl.pathname || '/';

  // 移除查询参数
  pathname = pathname.split('?')[0];

  // 解码URL路径
  pathname = decodeURIComponent(pathname);

  // 如果是静态资源请求（.js, .css, 图片等），尝试返回对应文件
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map|html)$/i.test(pathname)) {
    // 默认返回index.html
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // 构建完整文件路径
    const filePath = join(DIST_DIR, pathname);

    // 防止路径遍历攻击
    const normalizedPath = join(DIST_DIR, pathname);
    if (!normalizedPath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    // 服务文件
    serveFile(filePath, res);
  } else {
    // 对于所有其他路径（包括Vue Router的路由），都返回index.html
    // 这样可以支持Vue Router的history模式
    serveIndexHtml(res);
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请检查是否有其他服务在运行`);
  } else {
    console.error('服务器错误:', error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 静态文件服务器已启动`);
  console.log(`📁 服务目录: ${DIST_DIR}`);
  console.log(`🌐 本地访问: http://localhost:${PORT}`);
  console.log(`🌐 网络访问: http://${HOST}:${PORT}\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
