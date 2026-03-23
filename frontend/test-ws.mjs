/**
 * WebSocket 连接测试脚本
 * 直接连接目标 WebSocket 服务器，观察其响应
 */
import { WebSocket } from 'ws';

const WS_TARGET = process.env.WS_TARGET || 'ws://1.14.100.199:8050';

console.log('=========================================');
console.log('[Test] 目标服务器:', WS_TARGET);
console.log('=========================================');

const ws = new WebSocket(WS_TARGET);

ws.on('open', () => {
  console.log('[Test] 连接成功');
  
  // 发送 ping 消息
  const pingMsg = JSON.stringify({
    iCode: 'ping',
    iType: '0',
    iFrom: '0',
    iTo: '0',
    iTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    iSelfData: { timestamp: Date.now() }
  });
  
  console.log('[Test] 发送消息:', pingMsg);
  ws.send(pingMsg);
  
  // 5秒后再发送一条
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const pingMsg2 = JSON.stringify({
        iCode: 'ping',
        iType: '0',
        iFrom: '0',
        iTo: '0',
        iTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        iSelfData: { timestamp: Date.now() }
      });
      console.log('[Test] 发送消息:', pingMsg2);
      ws.send(pingMsg2);
    }
  }, 5000);
});

ws.on('message', (data, isBinary) => {
  const msgStr = isBinary ? data.toString('utf8') : data.toString();
  console.log('[Test] 收到消息 (原始):', data);
  console.log('[Test] 收到消息 (字符串):', msgStr);
  console.log('[Test] 是否二进制:', isBinary);
});

ws.on('close', (code, reason) => {
  console.log('[Test] 连接关闭, code:', code, 'reason:', reason.toString());
});

ws.on('error', (error) => {
  console.error('[Test] 错误:', error.message);
});

// 15秒后关闭
setTimeout(() => {
  console.log('[Test] 测试结束');
  ws.close();
  process.exit(0);
}, 15000);
