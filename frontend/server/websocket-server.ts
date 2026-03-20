/**
 * WebSocket 测试服务端
 * 用于测试 WebSocket 客户端通信
 * 
 * 运行方式: npx ts-node websocket-server.ts
 * 或: node websocket-server.js (需先编译)
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8080;
const server = new WebSocketServer({ port: PORT });

console.log(`[WebSocket Server] 服务端启动，监听端口 ${PORT}`);

// 连接的客户端列表
const clients = new Set<WebSocket>();

server.on('connection', (ws: WebSocket, req) => {
  const clientId = `client_${Date.now()}`;
  console.log(`[WebSocket Server] 新客户端连接: ${clientId}`);
  clients.add(ws);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'system_welcome',
    data: {
      message: '欢迎连接到 WebSocket 测试服务端',
      clientId,
      serverTime: Date.now()
    }
  }));

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[WebSocket Server] 收到消息 from ${clientId}:`, message);

      // 根据消息类型处理
      handleClientMessage(ws, message, clientId);
    } catch (error) {
      console.error(`[WebSocket Server] 消息解析失败:`, error);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket Server] 客户端断开: ${clientId}`);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket Server] 客户端错误 ${clientId}:`, error);
    clients.delete(ws);
  });
});

/**
 * 处理客户端消息
 */
function handleClientMessage(ws: WebSocket, message: any, clientId: string) {
  const { type, data } = message;

  switch (type) {
    // ========== 心跳相关 ==========
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
      break;

    // ========== 无人机相关 ==========
    case 'stUAVTargetReport':
      // 模拟目标上报
      const targetReport = {
        type: 'stUAVTargetReport',
        data: {
          targetId: `UAV_${Date.now()}`,
          targetType: 'DJI_Mavic',
          position: {
            lat: 39.9042 + Math.random() * 0.01,
            lng: 116.4074 + Math.random() * 0.01,
            alt: 100 + Math.random() * 50
          },
          velocity: {
            speed: 10 + Math.random() * 5,
            direction: Math.random() * 360
          },
          timestamp: Date.now()
        }
      };
      ws.send(JSON.stringify(targetReport));
      console.log(`[WebSocket Server] 发送目标上报到 ${clientId}`);
      break;

    case 'stUAVTargetUpdate':
      // 模拟目标更新
      ws.send(JSON.stringify({
        type: 'stUAVTargetUpdate',
        data: {
          targetId: data?.targetId || 'UAV_001',
          position: {
            lat: 39.9042 + Math.random() * 0.01,
            lng: 116.4074 + Math.random() * 0.01,
            alt: 100 + Math.random() * 50
          },
          timestamp: Date.now()
        }
      }));
      break;

    // ========== 设备控制相关 ==========
    case 'stControlCommand':
      // 模拟命令响应
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'stCommandResponse',
          data: {
            commandId: data?.commandId || `CMD_${Date.now()}`,
            code: 0,
            message: '命令执行成功',
            result: { status: 'completed' }
          }
        }));
        console.log(`[WebSocket Server] 发送命令响应到 ${clientId}`);
      }, 500);
      break;

    case 'stDeviceStatus':
      // 发送设备状态
      ws.send(JSON.stringify({
        type: 'stDeviceStatus',
        data: {
          deviceId: 'DEVICE_001',
          status: 'online',
          battery: 85,
          mode: 'standby'
        }
      }));
      break;

    // ========== 任务相关 ==========
    case 'stTaskAssign':
      // 模拟任务分配
      ws.send(JSON.stringify({
        type: 'stTaskAssign',
        data: {
          taskId: `TASK_${Date.now()}`,
          taskType: 'surveillance',
          targetId: 'UAV_001',
          priority: 1,
          params: { duration: 300 }
        }
      }));
      break;

    case 'stTaskProgress':
      // 模拟任务进度
      ws.send(JSON.stringify({
        type: 'stTaskProgress',
        data: {
          taskId: data?.taskId || 'TASK_001',
          progress: 50,
          stage: 'executing'
        }
      }));
      break;

    // ========== 系统相关 ==========
    case 'stAlarmInfo':
      // 模拟告警信息
      ws.send(JSON.stringify({
        type: 'stAlarmInfo',
        data: {
          alarmId: `ALARM_${Date.now()}`,
          alarmType: 'intrusion',
          level: 'warning',
          message: '检测到未授权无人机入侵',
          timestamp: Date.now()
        }
      }));
      break;

    case 'stSystemConfig':
      // 发送系统配置
      ws.send(JSON.stringify({
        type: 'stSystemConfig',
        data: {
          configType: 'radar',
          config: {
            range: 5000,
            sensitivity: 0.8
          },
          timestamp: Date.now()
        }
      }));
      break;

    // ========== 测试相关 ==========
    case 'test_echo':
      // 回显测试
      ws.send(JSON.stringify({
        type: 'test_echo_response',
        data: {
          original: data,
          serverTime: Date.now()
        }
      }));
      break;

    case 'test_broadcast':
      // 广播测试
      broadcast({
        type: 'test_broadcast',
        data: {
          from: clientId,
          message: data?.message || '广播消息',
          serverTime: Date.now()
        }
      });
      break;

    case 'test_request':
      // 请求-响应测试
      ws.send(JSON.stringify({
        type: 'test_requestResponse',
        data: {
          code: 0,
          message: '响应成功',
          result: { value: Math.random() * 100 }
        }
      }));
      break;

    default:
      console.log(`[WebSocket Server] 未知消息类型: ${type}`);
      // 未知消息原路返回
      ws.send(JSON.stringify({
        type: `${type}_echo`,
        data: message
      }));
  }
}

/**
 * 广播消息到所有客户端
 */
function broadcast(message: object): void {
  const payload = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
  console.log(`[WebSocket Server] 广播消息到 ${clients.size} 个客户端`);
}

/**
 * 定期发送模拟数据
 */
function startMockDataStream(): void {
  // 每 3 秒发送一次目标更新
  setInterval(() => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'stUAVTargetUpdate',
          data: {
            targetId: 'UAV_001',
            position: {
              lat: 39.9042 + Math.random() * 0.01,
              lng: 116.4074 + Math.random() * 0.01,
              alt: 100 + Math.random() * 50
            },
            timestamp: Date.now()
          }
        }));
      }
    });
  }, 3000);
}

// 启动模拟数据流
startMockDataStream();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[WebSocket Server] 正在关闭...');
  broadcast({ type: 'server_shutdown', data: { message: '服务端即将关闭' } });
  server.close(() => {
    console.log('[WebSocket Server] 服务端已关闭');
    process.exit(0);
  });
});
