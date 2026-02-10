import { EventEmitter } from 'events';
import { TCPClient, TCPClientConfig } from './client';
import logger from '../utils/logger';

export class TCPConnectionPool extends EventEmitter {
  private connections: Map<string, TCPClient> = new Map();
  private reconnectQueue: Set<string> = new Set();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('deviceData', (deviceId: string, data: any) => {
      this.emit('deviceData', deviceId, data);
    });

    this.on('deviceConnected', (deviceId: string) => {
      logger.info(`Device ${deviceId} connected via TCP`);
      // 更新设备状态（这里需要注入设备服务）
    });

    this.on('deviceDisconnected', (deviceId: string) => {
      logger.warn(`Device ${deviceId} disconnected from TCP`);
      // 更新设备状态
    });
  }

  public async addDevice(config: TCPClientConfig): Promise<void> {
    const { deviceId } = config;

    if (this.connections.has(deviceId)) {
      logger.warn(`Device ${deviceId} already exists in pool`);
      return;
    }

    logger.info(`Adding device ${deviceId} to TCP pool`);

    const client = new TCPClient(config);
    
    // 设置事件监听
    client.on('data', (data) => {
      this.emit('deviceData', deviceId, data);
    });

    client.on('connected', () => {
      this.emit('deviceConnected', deviceId);
      this.reconnectQueue.delete(deviceId);
    });

    client.on('disconnected', () => {
      this.emit('deviceDisconnected', deviceId);
      this.scheduleReconnect(config);
    });

    client.on('error', (error) => {
      logger.error(`TCP client error for ${deviceId}:`, error);
    });

    this.connections.set(deviceId, client);
    await client.connect();
  }

  public removeDevice(deviceId: string): void {
    const client = this.connections.get(deviceId);
    if (client) {
      client.disconnect();
      this.connections.delete(deviceId);
      this.reconnectQueue.delete(deviceId);
      logger.info(`Device ${deviceId} removed from TCP pool`);
    }
  }

  public sendToDevice(deviceId: string, command: any): Promise<any> {
    const client = this.connections.get(deviceId);
    
    if (!client || !client.isConnected()) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    return client.send(command);
  }

  private scheduleReconnect(config: TCPClientConfig): void {
    const { deviceId } = config;

    if (this.reconnectQueue.has(deviceId)) {
      return; // 已在重连队列中
    }

    this.reconnectQueue.add(deviceId);

    logger.info(`Scheduling reconnect for device ${deviceId}`);

    setTimeout(async () => {
      if (!this.connections.has(deviceId)) {
        return; // 设备已被移除
      }

      try {
        await this.connections.get(deviceId)!.connect();
      } catch (error) {
        logger.error(`Failed to reconnect device ${deviceId}:`, error);
        this.scheduleReconnect(config);
      }
    }, config.reconnectInterval);
  }

  public getConnectedDevices(): string[] {
    const connected: string[] = [];
    this.connections.forEach((client, deviceId) => {
      if (client.isConnected()) {
        connected.push(deviceId);
      }
    });
    return connected;
  }

  public getDeviceCount(): number {
    return this.connections.size;
  }

  public disconnectAll(): void {
    this.connections.forEach((client) => {
      client.disconnect();
    });
    this.connections.clear();
    this.reconnectQueue.clear();
  }
}

export const tcpConnectionPool = new TCPConnectionPool();
