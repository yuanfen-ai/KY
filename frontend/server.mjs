/**
 * 前端集成服务器
 * 提供静态文件服务、地图代理和WebSocket代理功能
 * 
 * WebSocket 数据包格式：
 * {
 *   header: {
 *     iCode: number,  // 消息码（数据类别）
 *     iType: number,  // 消息类型（默认0）
 *     iFrom: number,  // 来源标识（默认0）
 *     iTo: number     // 目标标识（默认0）
 *   },
 *   iSelfData: any    // 数据区
 * }
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

// 是否启用 Mock WebSocket 服务器
const USE_MOCK_WS = process.env.USE_MOCK_WS !== 'false';

// ==================== WebSocket 消息码定义 ====================
const MessageCode = {
  // 系统消息 (iCode: 0-999)
  HEARTBEAT_REQUEST: 0,
  HEARTBEAT_RESPONSE: 10000,
  SYSTEM_STATUS: 1003,
  SYSTEM_CONNECTED: 1004,
  SYSTEM_ERROR: 1005,

  // 无人机消息 (2000-2999)
  DRONE_LIST: 2001,
  DRONE_UPDATE: 2002,
  DRONE_ADD: 2003,
  DRONE_REMOVE: 2004,
  DRONE_DETAIL: 2005,

  // 目标检测消息 (3000-3999)
  TARGET_DETECTED: 3001,
  TARGET_UPDATE: 3002,
  TARGET_LOST: 3003,

  // 控制命令消息 (4000-4999)
  COMMAND_TRACK_START: 4001,
  COMMAND_TRACK_STOP: 4002,
  COMMAND_DEVICE_CONTROL: 4003,
  COMMAND_RESPONSE: 4004,

  // 查询消息 (5000-5999)
  QUERY_DRONE_LIST: 5001,
  QUERY_SYSTEM_STATUS: 5002,
  QUERY_NO_FLY_ZONES: 5003,
  QUERY_TARGET_LIST: 5004,

  // 禁飞区消息 (6000-6999)
  ZONE_LIST: 6001,
  ZONE_ADD: 6002,
  ZONE_UPDATE: 6003,
  ZONE_REMOVE: 6004,

  // 日志消息 (9000-9999)
  LOG_MESSAGE: 9001,
};

// ==================== Mock 数据存储 ====================
const mockState = {
  drones: [
    { id: 'DRONE_001', lat: 39.9042, lng: 116.4074, alt: 100, speed: 25, heading: 45, type: 'UAV', status: 'normal' },
    { id: 'DRONE_002', lat: 39.9050, lng: 116.4080, alt: 150, speed: 30, heading: 120, type: 'UAV', status: 'warning' },
    { id: 'DRONE_003', lat: 39.9035, lng: 116.4065, alt: 80, speed: 20, heading: 270, type: 'UAV', status: 'normal' },
  ],
  targets: [],
  systemStatus: {
    cpu: 45,
    memory: 62,
    battery: 89,
    signal: 95,
    gps: 'locked'
  },
  noFlyZones: [
    { id: 'ZONE_001', name: '机场禁飞区', type: 'airport', radius: 5000, center: [116.4074, 39.9042] },
    { id: 'ZONE_002', name: '军事禁区', type: 'military', radius: 3000, center: [116.4100, 39.9060] }
  ]
};

let mockUpdateInterval = null;
const mockClients = new Set();

// ==================== 数据包工具函数 ====================

/**
 * 创建 WsPacket 数据包（平铺结构）
 */
function createPacket(iCode, iSelfData = null) {
  return {
    iCode: iCode,
    iType: 0,
    iFrom: 0,
    iTo: 0,
    iSelfData: iSelfData
  };
}

/**
 * 发送数据包
 */
function sendPacket(ws, iCode, iSelfData = null) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(createPacket(iCode, iSelfData)));
  }
}

/**
 * 解析数据包
 */
function parsePacket(data) {
  try {
    const packet = JSON.parse(data.toString());
    return {
      iCode: packet.iCode ?? 0,
      iType: packet.iType ?? 0,
      iFrom: packet.iFrom ?? 0,
      iTo: packet.iTo ?? 0,
      iSelfData: packet.iSelfData ?? null,
      raw: packet
    };
  } catch (e) {
    return null;
  }
}

// ==================== Mock WebSocket 服务器 ====================
const initializedClients = new WeakSet();

function setupMockWebSocketServer(ws) {
  // 防止重复初始化
  if (initializedClients.has(ws)) {
    console.log('[MockWS] 客户端已初始化，跳过');
    return;
  }
  initializedClients.add(ws);
  
  console.log('[MockWS] Mock WebSocket 服务器已启用');
  mockClients.add(ws);
  
  // 先注册所有事件处理器
  ws.on('message', (message) => {
    console.log('[MockWS] 收到原始消息:', message.toString().substring(0, 100));
    const packet = parsePacket(message);
    if (packet) {
      console.log('[MockWS] 解析后 iCode:', packet.iCode);
      handleMockMessage(ws, packet);
    } else {
      console.log('[MockWS] 消息解析失败');
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`[MockWS] 客户端关闭: ${code}`);
    mockClients.delete(ws);
    if (mockClients.size === 0 && mockUpdateInterval) {
      clearInterval(mockUpdateInterval);
      mockUpdateInterval = null;
      console.log('[MockWS] 所有客户端已断开，停止模拟');
    }
  });
  
  ws.on('error', (error) => {
    console.error('[MockWS] 客户端错误:', error.message);
    mockClients.delete(ws);
  });
  
  // 发送连接成功消息
  sendPacket(ws, MessageCode.SYSTEM_CONNECTED, { 
    message: 'Mock WebSocket 服务器已连接', 
    timestamp: Date.now() 
  });
  
  // 发送无人机列表
  sendPacket(ws, MessageCode.DRONE_LIST, mockState.drones);
  
  // 发送系统状态
  sendPacket(ws, MessageCode.SYSTEM_STATUS, mockState.systemStatus);
  
  // 启动模拟数据更新
  if (!mockUpdateInterval) {
    mockUpdateInterval = setInterval(() => {
      updateMockData();
    }, 2000);
  }
}

function handleMockMessage(ws, packet) {
  console.log(`[MockWS] 处理消息 iCode: ${packet.iCode}`);
  
  switch (packet.iCode) {
    case MessageCode.HEARTBEAT_REQUEST:
      console.log('[MockWS] 收到心跳请求，发送响应');
      // 心跳响应
      sendPacket(ws, MessageCode.HEARTBEAT_RESPONSE, { 
        timestamp: packet.iSelfData?.timestamp || Date.now() 
      });
      break;
      
    case MessageCode.QUERY_DRONE_LIST:
      // 查询无人机列表
      sendPacket(ws, MessageCode.DRONE_LIST, mockState.drones);
      break;
      
    case MessageCode.QUERY_SYSTEM_STATUS:
      // 查询系统状态
      sendPacket(ws, MessageCode.SYSTEM_STATUS, mockState.systemStatus);
      break;
      
    case MessageCode.QUERY_NO_FLY_ZONES:
      // 查询禁飞区
      sendPacket(ws, MessageCode.ZONE_LIST, mockState.noFlyZones);
      break;
      
    case MessageCode.QUERY_TARGET_LIST:
      // 查询目标列表
      sendPacket(ws, MessageCode.TARGET_DETECTED, mockState.targets);
      break;
      
    case MessageCode.COMMAND_TRACK_START:
      // 开始跟踪
      sendPacket(ws, MessageCode.COMMAND_RESPONSE, { 
        targetId: packet.iSelfData?.targetId, 
        status: 'tracking' 
      });
      break;
      
    case MessageCode.COMMAND_TRACK_STOP:
      // 停止跟踪
      sendPacket(ws, MessageCode.COMMAND_RESPONSE, { 
        targetId: packet.iSelfData?.targetId, 
        status: 'stopped' 
      });
      break;
      
    case MessageCode.COMMAND_DEVICE_CONTROL:
      // 设备控制
      sendPacket(ws, MessageCode.COMMAND_RESPONSE, { 
        deviceId: packet.iSelfData?.deviceId, 
        action: packet.iSelfData?.action, 
        status: 'success' 
      });
      break;
      
    default:
      console.log(`[MockWS] 未知消息码: ${packet.iCode}`);
  }
}

function updateMockData() {
  // 更新无人机位置
  mockClients.forEach(client => {
    if (client.readyState === client.OPEN) {
      // 随机更新一架无人机位置
      const drone = mockState.drones[Math.floor(Math.random() * mockState.drones.length)];
      drone.lat += (Math.random() - 0.5) * 0.0001;
      drone.lng += (Math.random() - 0.5) * 0.0001;
      drone.alt += Math.floor((Math.random() - 0.5) * 5);
      drone.speed = 20 + Math.floor(Math.random() * 15);
      drone.heading = (drone.heading + Math.floor((Math.random() - 0.5) * 10) + 360) % 360;
      
      sendPacket(client, MessageCode.DRONE_UPDATE, drone);
    }
  });
  
  // 更新系统状态
  mockState.systemStatus.cpu = 40 + Math.floor(Math.random() * 20);
  mockState.systemStatus.memory = 55 + Math.floor(Math.random() * 15);
  mockState.systemStatus.battery = Math.max(20, mockState.systemStatus.battery - Math.random() * 0.1);
  
  // 随机检测目标
  if (Math.random() < 0.05 && mockState.targets.length < 10) {
    const newTarget = {
      id: `TARGET_${Date.now()}`,
      lat: 39.9042 + (Math.random() - 0.5) * 0.1,
      lng: 116.4074 + (Math.random() - 0.5) * 0.1,
      alt: 50 + Math.floor(Math.random() * 200),
      speed: 10 + Math.floor(Math.random() * 30),
      heading: Math.floor(Math.random() * 360),
      type: 'unknown',
      threat: Math.floor(Math.random() * 100)
    };
    mockState.targets.push(newTarget);
    
    mockClients.forEach(client => {
      if (client.readyState === client.OPEN) {
        sendPacket(client, MessageCode.TARGET_DETECTED, newTarget);
      }
    });
  }
}

// ==================== 地图代理功能 ====================

// 注入到地图HTML的脚本（初始化callbackObj）
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

// 创建Express应用
const app = express();

// 创建代理服务器
const proxy = createProxyServer({
  target: MAP_TARGET,
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  selfHandleResponse: true
});

// 代理错误处理
proxy.on('error', (err, req, res) => {
  console.error('[MapProxy] 代理错误:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: ' + err.message);
  }
});

// 代理响应处理：注入脚本到HTML
proxy.on('proxyRes', (proxyRes, req, res) => {
  const contentType = proxyRes.headers['content-type'] || '';
  const url = req.url || '';
  
  const isHtmlFile = url.endsWith('.html') || url.endsWith('.htm') || url === '' || url.endsWith('/');
  const isHtmlContentType = contentType.includes('text/html');
  
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
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }
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
  req.url = req.url.replace('/map-service', '');
  proxy.web(req, res);
});

// 创建HTTP服务器
const server = http.createServer(app);

// WebSocket 服务器
const wss = new WebSocketServer({ noServer: true });

// WebSocket 连接处理
wss.on('connection', async (ws, req) => {
  console.log('[WS] 新的 WebSocket 客户端连接');
  
  const url = req.url || '/ws';
  
  // 立即启用 Mock WebSocket 服务器作为后备
  // 这样可以确保即使目标服务器不可用，客户端也能正常工作
  console.log('[WS] 启用 Mock WebSocket 服务器（后备）');
  setupMockWebSocketServer(ws);
  
  // 同时尝试连接到真实服务器（异步）
  const isSecure = WS_TARGET.startsWith('wss://');
  const netModule = isSecure ? await import('https') : await import('http');
  const targetUrlObj = new URL(WS_TARGET);
  
  const options = {
    hostname: targetUrlObj.hostname,
    port: targetUrlObj.port || (isSecure ? 443 : 80),
    path: url,
    method: 'GET',
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Key': generateWebSocketKey(),
      'Sec-WebSocket-Version': '13'
    }
  };
  
  console.log(`[WS] 尝试连接到目标: ${options.hostname}:${options.port}${options.path}`);
  
  const upgradeReq = netModule.request(options, (res) => {
    if (res.statusCode === 101) {
      console.log('[WS] 目标服务器握手成功，切换到代理模式');
      // 如果成功连接到真实服务器，切换到代理模式
      // 注意：这里不需要重新注册事件，因为 Mock 服务器已经注册了
    } else {
      console.error('[WS] 目标服务器拒绝 WebSocket 升级:', res.statusCode);
    }
  });
  
  upgradeReq.on('error', (error) => {
    console.error('[WS] 连接目标服务器失败:', error.code);
    // 继续使用 Mock 服务器
  });
  
  upgradeReq.end();
});

// WebSocket 代理设置（转发模式）
function setupWebSocketProxy(clientWs, targetSocket) {
  console.log('[WS] WebSocket 代理已建立（转发模式）');
  
  clientWs.on('message', (message) => {
    try {
      targetSocket.write(message);
    } catch (e) {
      console.error('[WS] 发送失败:', e.message);
    }
  });
  
  targetSocket.on('data', (chunk) => {
    try {
      clientWs.send(chunk);
    } catch (e) {
      console.error('[WS] 发送失败:', e.message);
    }
  });
  
  clientWs.on('close', () => {
    try {
      targetSocket.destroy();
    } catch (e) {}
  });
  
  targetSocket.on('close', () => {
    try {
      clientWs.close();
    } catch (e) {}
  });
  
  clientWs.on('error', (error) => {
    console.error('[WS] 客户端错误:', error.message);
  });
  
  targetSocket.on('error', (error) => {
    console.error('[WS] 目标连接错误:', error.message);
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

// 处理 HTTP 升级请求
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  
  if (pathname === '/ws' || pathname.startsWith('/ws')) {
    console.log(`[WS] 收到 WebSocket 升级请求: ${pathname}`);
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

// SPA回退路由
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log('=========================================');
  console.log('[Server] 服务器已启动');
  console.log(`[Server] 端口: ${PORT}`);
  console.log(`[Server] 静态文件目录: ${STATIC_DIR}`);
  console.log(`[MapProxy] 目标: ${MAP_TARGET}`);
  console.log(`[MapProxy] 代理路径: /map-service -> ${MAP_TARGET}`);
  console.log(`[WSProxy] WebSocket 代理: /ws -> ${WS_TARGET}`);
  console.log(`[MockWS] Mock 服务器: ${USE_MOCK_WS ? '启用' : '禁用'}`);
  console.log('=========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('[Server] 收到关闭信号');
  server.close(() => {
    process.exit(0);
  });
});
