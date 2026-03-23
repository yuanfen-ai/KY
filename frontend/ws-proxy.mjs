/**
 * 独立的 WebSocket 代理服务器
 * 用于解决 Vite WebSocket 代理的问题
 */
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = 8080;
const TARGET_HOST = '1.14.100.199';
const TARGET_PORT = 8050;

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Proxy Server');
});

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ noServer: true });

// 处理 HTTP 升级请求
server.on('upgrade', (request, socket, head) => {
  console.log('[WS-Proxy] 收到 WebSocket 升级请求');
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// 处理 WebSocket 连接
wss.on('connection', (clientWs, request) => {
  console.log('[WS-Proxy] 新的客户端连接');
  
  // 连接到目标服务器
  const targetWs = new WebSocket(`ws://${TARGET_HOST}:${TARGET_PORT}/ws`);
  
  targetWs.on('open', () => {
    console.log('[WS-Proxy] 已连接到目标服务器');
  });
  
  // 客户端 -> 目标服务器
  clientWs.on('message', (data) => {
    const msg = data.toString();
    console.log('[WS-Proxy] 客户端->目标:', msg);
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(msg);
    }
  });
  
  // 目标服务器 -> 客户端
  targetWs.on('message', (data) => {
    const msg = data.toString();
    console.log('[WS-Proxy] 目标->客户端:', msg);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(msg);
    }
  });
  
  // 客户端关闭
  clientWs.on('close', () => {
    console.log('[WS-Proxy] 客户端关闭连接');
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.close();
    }
  });
  
  // 目标服务器关闭
  targetWs.on('close', () => {
    console.log('[WS-Proxy] 目标服务器关闭连接');
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });
  
  // 错误处理
  clientWs.on('error', (err) => {
    console.error('[WS-Proxy] 客户端错误:', err.message);
  });
  
  targetWs.on('error', (err) => {
    console.error('[WS-Proxy] 目标服务器错误:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[WS-Proxy] WebSocket 代理服务器启动在端口 ${PORT}`);
  console.log(`[WS-Proxy] 代理目标: ws://${TARGET_HOST}:${TARGET_PORT}/ws`);
});
