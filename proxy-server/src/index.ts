import { connectDatabase, closeDatabase } from './config/database';
import { config } from './config';
import logger from './utils/logger';
import WebSocketServerInstance from './websocket/server';
import MessageHandler from './websocket/handler';
import { tcpConnectionPool } from './tcp/pool';
import Device from './models/device';
import { WebSocket } from 'ws';

async function startServer(): Promise<void> {
  try {
    logger.info('Starting KY Proxy Server...');
    logger.info(`Environment: ${config.env}`);

    // 连接数据库
    await connectDatabase();

    // 创建WebSocket服务器
    const wsServer = new WebSocketServerInstance({
      port: config.ws.port,
      path: config.ws.path,
      heartbeatInterval: config.ws.heartbeatInterval,
      heartbeatTimeout: config.ws.heartbeatTimeout,
      maxConnections: config.ws.maxConnections
    });

    // 创建消息处理器
    const messageHandler = new MessageHandler(wsServer);

    // 设置WebSocket事件监听
    wsServer.on('connection', (ws: WebSocket) => {
      // 新连接
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          messageHandler.handle(ws, message);
        } catch (error) {
          logger.error('Failed to parse message:', error);
        }
      });
    });

    wsServer.on('message', (ws: WebSocket, message: any) => {
      messageHandler.handle(ws, message);
    });

    wsServer.on('disconnect', (ws: WebSocket) => {
      messageHandler.handleDisconnect(ws);
    });

    // 设置TCP设备数据广播
    tcpConnectionPool.on('deviceData', (deviceId: string, data: any) => {
      messageHandler.broadcastDeviceData(deviceId, data);
    });

    // 启动WebSocket服务器
    wsServer.start();
    logger.info('WebSocket server started');

    // 加载设备并添加到TCP连接池
    const devices = await Device.findAll();
    logger.info(`Found ${devices.length} devices in database`);

    for (const device of devices) {
      try {
        await tcpConnectionPool.addDevice({
          deviceId: device.device_id,
          host: device.tcp_host,
          port: device.tcp_port
        });
        logger.info(`Device ${device.device_id} added to TCP pool`);
      } catch (error) {
        logger.error(`Failed to add device ${device.device_id} to TCP pool:`, error);
      }
    }

    logger.info('Server started successfully');

    // 优雅关闭
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    async function gracefulShutdown() {
      logger.info('Received shutdown signal, closing connections...');
      
      wsServer.stop();
      tcpConnectionPool.disconnectAll();
      await closeDatabase();
      
      logger.info('Server stopped');
      process.exit(0);
    }

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
