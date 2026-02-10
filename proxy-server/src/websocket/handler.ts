import { WebSocket } from 'ws';
import logger from '../utils/logger';
import Device from '../models/device';
import { tcpConnectionPool } from '../tcp/pool';

export class MessageHandler {
  constructor(private wsServer: any) {}

  public async handle(ws: WebSocket, message: any): Promise<void> {
    const sessionId = (ws as any).metadata?.sessionId;
    
    logger.debug(`Received message from ${sessionId}:`, message);

    switch (message.type) {
      case 'ping':
        this.handlePing(ws);
        break;
      
      case 'subscribe':
        await this.handleSubscribe(ws, message);
        break;
      
      case 'unsubscribe':
        await this.handleUnsubscribe(ws, message);
        break;
      
      case 'command':
        await this.handleCommand(ws, message);
        break;
      
      case 'getDeviceList':
        await this.handleGetDeviceList(ws);
        break;
      
      default:
        logger.warn(`Unknown message type: ${message.type}`);
        this.sendError(ws, 'Unknown message type');
    }
  }

  private handlePing(ws: WebSocket): void {
    this.send(ws, {
      type: 'pong',
      timestamp: Date.now()
    });
  }

  private async handleSubscribe(ws: WebSocket, message: any): Promise<void> {
    const { deviceId } = message;
    const sessionId = (ws as any).metadata?.sessionId;

    if (!deviceId) {
      this.sendError(ws, 'Device ID is required');
      return;
    }

    // 验证设备是否存在
    const device = await Device.findOne({ where: { device_id: deviceId } });
    if (!device) {
      this.sendError(ws, 'Device not found');
      return;
    }

    // 添加订阅
    if (!(ws as any).metadata.subscriptions) {
      (ws as any).metadata.subscriptions = new Set();
    }
    (ws as any).metadata.subscriptions.add(deviceId);

    logger.info(`${sessionId} subscribed to device ${deviceId}`);

    this.send(ws, {
      type: 'subscribed',
      deviceId,
      timestamp: Date.now()
    });
  }

  private async handleUnsubscribe(ws: WebSocket, message: any): Promise<void> {
    const { deviceId } = message;
    const sessionId = (ws as any).metadata?.sessionId;

    if ((ws as any).metadata?.subscriptions) {
      (ws as any).metadata.subscriptions.delete(deviceId);
    }

    logger.info(`${sessionId} unsubscribed from device ${deviceId}`);

    this.send(ws, {
      type: 'unsubscribed',
      deviceId,
      timestamp: Date.now()
    });
  }

  private async handleCommand(ws: WebSocket, message: any): Promise<void> {
    const { deviceId, data } = message;
    const sessionId = (ws as any).metadata?.sessionId;

    if (!deviceId || !data?.command) {
      this.sendError(ws, 'Device ID and command are required');
      return;
    }

    try {
      // 验证设备
      const device = await Device.findOne({ where: { device_id: deviceId } });
      if (!device) {
        this.send(ws, {
          type: 'deviceResponse',
          deviceId,
          status: 'error',
          message: 'Device not found',
          timestamp: Date.now()
        });
        return;
      }

      // 检查设备状态
      if (device.status !== 'online') {
        this.send(ws, {
          type: 'deviceResponse',
          deviceId,
          status: 'error',
          message: 'Device is not online',
          timestamp: Date.now()
        });
        return;
      }

      // 发送到TCP设备
      const result = await tcpConnectionPool.sendToDevice(deviceId, {
        type: 'command',
        command: data.command,
        params: data.params
      });

      this.send(ws, {
        type: 'deviceResponse',
        deviceId,
        status: 'success',
        result,
        timestamp: Date.now()
      });
    } catch (error: any) {
      logger.error(`Failed to send command to device ${deviceId}:`, error);
      this.send(ws, {
        type: 'deviceResponse',
        deviceId,
        status: 'error',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  private async handleGetDeviceList(ws: WebSocket): Promise<void> {
    try {
      const devices = await Device.findAll();
      
      this.send(ws, {
        type: 'deviceList',
        devices: devices.map(d => d.toJSON()),
        timestamp: Date.now()
      });
    } catch (error: any) {
      logger.error('Failed to get device list:', error);
      this.sendError(ws, 'Failed to get device list');
    }
  }

  public handleDisconnect(ws: WebSocket): void {
    // 清理订阅
    if ((ws as any).metadata?.subscriptions) {
      (ws as any).metadata.subscriptions.clear();
    }
  }

  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    this.send(ws, {
      type: 'error',
      message,
      timestamp: Date.now()
    });
  }

  // 广播设备数据到订阅的客户端
  public broadcastDeviceData(deviceId: string, data: any): void {
    const message = {
      type: 'deviceData',
      deviceId,
      data,
      timestamp: Date.now()
    };

    // 广播给订阅该设备的所有客户端
    this.wsServer.broadcast(message, (ws: WebSocket) => {
      return (ws as any).metadata?.subscriptions?.has(deviceId);
    });

    logger.debug(`Broadcasted data for device ${deviceId}`);
  }
}

export default MessageHandler;
