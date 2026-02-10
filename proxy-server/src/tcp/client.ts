import { Socket } from 'net';
import { EventEmitter } from 'events';
import logger from '../utils/logger';
import { config } from '../config';

export interface TCPClientConfig {
  deviceId: string;
  host: string;
  port: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export class TCPClient extends EventEmitter {
  private socket: Socket | null = null;
  private config: Required<TCPClientConfig>;
  private isConnectedFlag: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private responseCallbacks: Map<string, (data: any) => void> = new Map();

  constructor(inputConfig: TCPClientConfig) {
    super();
    this.config = {
      deviceId: inputConfig.deviceId,
      host: inputConfig.host,
      port: inputConfig.port,
      reconnectInterval: inputConfig.reconnectInterval ?? config.tcp.reconnectInterval,
      heartbeatInterval: inputConfig.heartbeatInterval ?? config.tcp.heartbeatInterval
    };
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.disconnect();
      }

      logger.info(`Connecting to device ${this.config.deviceId} at ${this.config.host}:${this.config.port}`);

      this.socket = new Socket();
      this.socket.setTimeout(10000); // 10秒连接超时

      this.socket.on('connect', () => {
        logger.info(`Device ${this.config.deviceId} connected`);
        this.isConnectedFlag = true;
        this.startHeartbeat();
        this.emit('connected');
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('error', (error) => {
        logger.error(`Device ${this.config.deviceId} socket error:`, error);
        this.emit('error', error);
      });

      this.socket.on('close', () => {
        logger.info(`Device ${this.config.deviceId} connection closed`);
        this.handleDisconnect();
      });

      this.socket.on('timeout', () => {
        logger.error(`Device ${this.config.deviceId} connection timeout`);
        this.socket?.destroy();
      });

      this.socket.connect(this.config.port, this.config.host);
    });
  }

  public disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }

    this.isConnectedFlag = false;
  }

  public send(command: any, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedFlag) {
        reject(new Error('Not connected'));
        return;
      }

      const requestId = this.generateRequestId();
      const payload = JSON.stringify({
        requestId,
        ...command,
        timestamp: Date.now()
      });

      // 设置响应回调
      const timer = setTimeout(() => {
        this.responseCallbacks.delete(requestId);
        reject(new Error('Command timeout'));
      }, timeout);

      this.responseCallbacks.set(requestId, (data) => {
        clearTimeout(timer);
        resolve(data);
      });

      // 发送数据
      this.socket.write(payload + '\n', (error) => {
        if (error) {
          clearTimeout(timer);
          this.responseCallbacks.delete(requestId);
          reject(error);
        }
      });

      logger.debug(`Sent command to ${this.config.deviceId}:`, command);
    });
  }

  public isConnected(): boolean {
    return this.isConnectedFlag;
  }

  private handleData(data: Buffer): void {
    try {
      const messages = data.toString().split('\n').filter(Boolean);
      
      for (const message of messages) {
        const parsed = JSON.parse(message);
        logger.debug(`Received data from ${this.config.deviceId}:`, parsed);

        // 处理响应
        if (parsed.requestId && this.responseCallbacks.has(parsed.requestId)) {
          const callback = this.responseCallbacks.get(parsed.requestId)!;
          callback(parsed);
          this.responseCallbacks.delete(parsed.requestId);
        } else {
          // 上报数据
          this.emit('data', parsed);
        }
      }
    } catch (error) {
      logger.error(`Failed to parse data from ${this.config.deviceId}:`, error);
    }
  }

  private handleDisconnect(): void {
    if (this.isConnectedFlag) {
      this.isConnectedFlag = false;
      this.stopHeartbeat();
      this.emit('disconnected');

      // 清理所有待处理的回调
      this.responseCallbacks.forEach((callback) => {
        callback({ error: 'Connection lost' });
      });
      this.responseCallbacks.clear();

      // 触发重连
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error(`Failed to reconnect device ${this.config.deviceId}:`, error);
        this.scheduleReconnect();
      }
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.isConnectedFlag) {
        this.socket.write(JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        }) + '\n');
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default TCPClient;
