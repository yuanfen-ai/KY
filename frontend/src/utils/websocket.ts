import type { WebSocketConfig, MessagePayload } from '@/types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private currentAttempt: number = 0;
  private messageQueue: MessagePayload[] = [];
  private isManualClose: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectInterval: config.reconnectInterval ?? 3000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
      onConnected: config.onConnected ?? (() => {}),
      onDisconnected: config.onDisconnected ?? (() => {}),
      onMessage: config.onMessage ?? (() => {}),
      onError: config.onError ?? (() => {}),
      url: config.url
    };

    this.connect();
  }

  // 连接WebSocket
  private connect(): void {
    try {
      console.log(`[WebSocket] 正在连接到 ${this.config.url}...`);
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocket] 连接失败:', error);
      this.attemptReconnect();
    }
  }

  // 连接成功
  private handleOpen(): void {
    console.log('[WebSocket] 连接成功');
    this.currentAttempt = 0;
    this.isManualClose = false;
    
    // 发送队列中的消息
    this.flushMessageQueue();
    
    // 启动心跳
    this.startHeartbeat();
    
    // 触发回调
    this.config.onConnected();
    this.emit('connected');
  }

  // 接收消息
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // 处理心跳响应
      if (data.type === 'pong') {
        this.resetHeartbeatTimeout();
        return;
      }
      
      // 触发消息回调
      this.config.onMessage(data);
      this.emit('message', data);
      
      // 触发特定类型的事件
      if (data.type) {
        this.emit(data.type, data);
      }
    } catch (error) {
      console.error('[WebSocket] 消息解析失败:', error);
    }
  }

  // 连接错误
  private handleError(event: Event): void {
    console.error('[WebSocket] 连接错误:', event);
    this.config.onError(event);
    this.emit('error', event);
  }

  // 连接关闭
  private handleClose(event: CloseEvent): void {
    console.log(`[WebSocket] 连接关闭: code=${event.code}, reason=${event.reason}`);
    
    // 清理定时器
    this.stopHeartbeat();
    
    // 触发回调
    this.config.onDisconnected();
    this.emit('disconnected', event);
    
    // 自动重连（非手动关闭）
    if (!this.isManualClose) {
      this.attemptReconnect();
    }
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.currentAttempt >= this.config.reconnectAttempts) {
      console.error('[WebSocket] 达到最大重连次数，停止重连');
      this.emit('reconnectFailed');
      return;
    }

    this.currentAttempt++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.currentAttempt - 1); // 指数退避
    
    console.log(`[WebSocket] ${delay}ms 后进行第 ${this.currentAttempt} 次重连尝试`);
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // 启动心跳
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
        this.resetHeartbeatTimeout();
      }
    }, this.config.heartbeatInterval);
  }

  // 重置心跳超时
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
    
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('[WebSocket] 心跳超时，关闭连接');
      this.ws?.close();
    }, this.config.heartbeatTimeout);
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  // 发送消息
  public send(payload: MessagePayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('[WebSocket] 连接未就绪，消息加入队列');
      this.messageQueue.push(payload);
      
      // 触发重连
      if (!this.isManualClose && this.currentAttempt < this.config.reconnectAttempts) {
        this.connect();
      }
    }
  }

  // 发送队列中的消息
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  // 事件监听
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  // 移除事件监听
  public off(event: string, handler?: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
      } else {
        handlers.clear();
      }
    }
  }

  // 触发事件
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // 手动关闭
  public close(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual close');
      this.ws = null;
    }
  }

  // 获取连接状态
  public getState(): string {
    if (!this.ws) return 'CLOSED';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  // 清理
  public destroy(): void {
    this.close();
    this.eventHandlers.clear();
    this.messageQueue = [];
  }
}

export default WebSocketService;
