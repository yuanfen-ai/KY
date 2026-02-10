const WebSocket = require('ws');

console.log('Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('open', () => {
  console.log('✓ WebSocket connection established');

  // 发送ping消息
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: Date.now()
  }));

  console.log('✓ Ping message sent');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('✓ Received message:', message);

  if (message.type === 'connected') {
    console.log('✓ Session ID:', message.sessionId);
    console.log('✓ Closing connection...');
    ws.close();
  }
});

ws.on('close', () => {
  console.log('✓ WebSocket connection closed');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('✗ WebSocket error:', error.message);
  process.exit(1);
});

// 超时保护
setTimeout(() => {
  console.error('✗ Connection timeout');
  ws.close();
  process.exit(1);
}, 5000);
