/**
 * 测试代理服务器的消息转发
 */
import { WebSocket } from 'ws';

const PROXY_URL = 'ws://localhost:5000/ws';

console.log('=========================================');
console.log('[Test] 测试代理服务器');
console.log('[Test] 代理地址:', PROXY_URL);
console.log('=========================================');

const ws = new WebSocket(PROXY_URL);

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
});

ws.on('message', (data, isBinary) => {
  const msgStr = isBinary ? data.toString('utf8') : data.toString();
  console.log('[Test] ★★★ 收到消息 ★★★');
  console.log('[Test] 原始:', data);
  console.log('[Test] 字符串:', msgStr);
  
  // 解析并检查
  try {
    const msg = JSON.parse(msgStr);
    console.log('[Test] 解析后:', JSON.stringify(msg, null, 2));
    console.log('[Test] iCode:', msg.iCode, '类型:', typeof msg.iCode);
  } catch (e) {
    console.error('[Test] 解析失败:', e.message);
  }
});

ws.on('close', (code, reason) => {
  console.log('[Test] 连接关闭, code:', code, 'reason:', reason.toString());
});

ws.on('error', (error) => {
  console.error('[Test] 错误:', error.message);
});

// 20秒后关闭
setTimeout(() => {
  console.log('[Test] 测试结束');
  ws.close();
  process.exit(0);
}, 20000);
