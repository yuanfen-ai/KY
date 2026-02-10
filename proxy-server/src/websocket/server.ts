import { WebSocketServer, WebSocket, RawData } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import logger from '../utils/logger';
import { config } from '../config';

export interface WebSocketServerConfig {
  port: number;
  path: string;
  heartbeatInterval: number;
  heartbeatTimeout: number;
  maxConnections: number;
}

export class WebSocketServerInstance {
  private wss: WebSocketServer;
  private httpServer: HttpServer;
  private config: WebSocketServerConfig;
  private heartbeatIntervalMap: Map<WebSocket, NodeJS.Timeout> = new Map();
  private connectionCount: number = 0;

  constructor(wsConfig: WebSocketServerConfig) {
    this.config = wsConfig;
    this.httpServer = createServer();
    this.wss = new WebSocketServer({ 
      server: this.httpServer,
      path: wsConfig.path,
      maxPayload: 1024 * 1024 // 1MB
    });

    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    
    this.wss.on('close', () => {
      logger.info('WebSocket server closed');
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  private handleConnection(ws: WebSocket, req: any): void {
    // 连接数限制
    if (this.connectionCount >= this.config.maxConnections) {
      logger.warn('Max connections reached, rejecting new connection');
      ws.close(1008, 'Max connections reached');
      return;
    }

    this.connectionCount++;
    const sessionId = this.generateSessionId();
    
    logger.info(`New WebSocket connection: ${sessionId}, total: ${this.connectionCount}`);

    // 设置WebSocket元数据
    (ws as any).metadata = {
      sessionId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set<string>()
    };

    // 设置消息处理器
    ws.on('message', (data: RawData) => this.handleMessage(ws, data));
    
    ws.on('pong', () => this.handlePong(ws));
    
    ws.on('close', () => this.handleDisconnection(ws));
    
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${sessionId}:`, error);
    });

    // 启动心跳
    this.startHeartbeat(ws);

    // 发送连接成功消息
    this.send(ws, {
      type: 'connected',
      sessionId,
      timestamp: Date.now()
    });

    // 触发连接事件
    this.emit('connection', ws);
  }

  private handleMessage(ws: WebSocket, data: RawData): void {
    const sessionId = (ws as any).metadata?.sessionId;
    
    try {
      const message = JSON.parse(data.toString());
      
      // 更新活动时间
      (ws as any).metadata.lastActivity = new Date();
      
      // 触发消息事件
      this.emit('message', ws, message);
      
    } catch (error) {
      logger.error(`Failed to handle message from ${sessionId}:`, error);
      this.send(ws, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: Date.now()
      });
    }
  }

  private handlePong(ws: WebSocket): void {
    // 重置心跳超时
    const heartbeatTimer = this.heartbeatIntervalMap.get(ws);
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      this.startHeartbeat(ws);
    }
  }

  private handleDisconnection(ws: WebSocket): void {
    const sessionId = (ws as any).metadata?.sessionId;
    
    // 清理心跳定时器
    const heartbeatTimer = this.heartbeatIntervalMap.get(ws);
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      this.heartbeatIntervalMap.delete(ws);
    }

    // 清理订阅
    if ((ws as any).metadata?.subscriptions) {
      (ws as any).metadata.subscriptions.clear();
    }

    this.connectionCount--;
    logger.info(`WebSocket disconnected: ${sessionId}, remaining: ${this.connectionCount}`);

    // 触发断开事件
    this.emit('disconnect', ws);
  }

  private startHeartbeat(ws: WebSocket): void {
    // 清除旧的心跳定时器
    const oldTimer = this.heartbeatIntervalMap.get(ws);
    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    // 设置新的心跳超时定时器
    const timer = setTimeout(() => {
      logger.warn(`Heartbeat timeout for ${(ws as any).metadata?.sessionId}, closing connection`);
      ws.terminate();
    }, this.config.heartbeatTimeout);

    this.heartbeatIntervalMap.set(ws, timer);

    // 发送ping
    ws.ping();
  }

  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public broadcast(message: any, filter?: (ws: WebSocket) => boolean): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (!filter || filter(client)) {
          this.send(client, message);
        }
      }
    });
  }

  public start(): void {
    this.httpServer.listen(this.config.port, () => {
      logger.info(`WebSocket server started on port ${this.config.port}`);
    });
  }

  public stop(): void {
    this.wss.close();
    this.httpServer.close();
    logger.info('WebSocket server stopped');
  }

  // 事件发射器
  private events: Map<string, Function[]> = new Map();

  public on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  public getConnectionCount(): number {
    return this.connectionCount;
  }
}

export default WebSocketServerInstance;
