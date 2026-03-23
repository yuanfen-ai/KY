/**
 * WebSocket 客户端服务
 * 使用统一的 WsPacket 数据包格式
 * 
 * 数据包格式：
 * {
 *   iCode: string,  // 消息码（心跳：发送"ping"，接收"pong"）
 *   iType: string,  // 消息类型（默认"0"）
 *   iFrom: string,  // 来源标识（默认"0"）
 *   iTo: string     // 目标标识（默认"0"）
 *   iSelfData: any  // 数据区
 * }
 */

import type { WebSocketConfig, WsPacket } from '@/types';
import { MessageCode, createWsPacket, getCurrentTimeString } from '@/types';

// 心跳消息码常量
const HEARTBEAT_PING = 'ping';  // 客户端发送的心跳请求
const HEARTBEAT_PONG = 'pong';  // 服务端返回的心跳响应

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private currentAttempt: number = 0;
  private messageQueue: WsPacket[] = [];
  private isManualClose: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private connectionId: string = '';

  constructor(config: WebSocketConfig) {
    this.connectionId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[WS] [${this.connectionId}] WebSocket 服务初始化`);
    console.log(`[WS] [${this.connectionId}] 连接地址: ${config.url}`);

    this.config = {
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectInterval: config.reconnectInterval ?? 3000,
      heartbeatInterval: config.heartbeatInterval ?? 10000,
      heartbeatTimeout: config.heartbeatTimeout ?? 5000,
      onConnected: config.onConnected ?? (() => {}),
      onDisconnected: config.onDisconnected ?? (() => {}),
      onMessage: config.onMessage ?? (() => {}),
      onError: config.onError ?? (() => {}),
      url: config.url
    };

    this.connect();
  }

  // ==================== 连接管理 ====================

  private connect(): void {
    console.log(`[WS] [${this.connectionId}] 正在建立连接... (第 ${this.currentAttempt + 1} 次尝试)`);

    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error(`[WS] [${this.connectionId}] 创建 WebSocket 实例失败:`, error);
      this.attemptReconnect();
    }
  }

  private handleOpen(): void {
    console.log(`[WS] [${this.connectionId}] WebSocket 连接成功`);
    
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

  /**
   * 接收消息处理 - 解析 WsPacket 格式
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const packet: WsPacket = JSON.parse(event.data);
      
      const iCode = packet.iCode;
      
      // 接收消息时打印所有收到的消息
      console.log(`[WS-MESSAGE] [${this.connectionId}] 收到消息:`, JSON.stringify(packet, null, 2));
      
      // 处理心跳响应（服务端返回 pong）
      if (iCode === HEARTBEAT_PONG) {
        console.log(`[WS-HEARTBEAT] [${this.connectionId}] 收到心跳响应 (pong)`);
        this.resetHeartbeatTimeout();
        this.emit('heartbeat_response', packet);
        return;
      }
      
      // 触发消息回调
      this.config.onMessage(packet);
      
      // 触发通用消息事件
      this.emit('message', packet);
      
      // 触发特定 iCode 的事件
      this.emit(`iCode_${iCode}`, packet);
      
    } catch (error) {
      console.error(`[WS] [${this.connectionId}] 消息解析失败:`, error);
    }
  }

  private handleError(event: Event): void {
    console.error(`[WS] [${this.connectionId}] WebSocket 连接错误`);
    this.config.onError(event);
    this.emit('error', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log(`[WS] [${this.connectionId}] WebSocket 连接关闭 (code: ${event.code})`);
    
    this.stopHeartbeat();
    this.config.onDisconnected();
    this.emit('disconnected', event);
    
    if (!this.isManualClose) {
      this.attemptReconnect();
    }
  }

  // ==================== 重连管理 ====================

  private attemptReconnect(): void {
    if (this.currentAttempt >= this.config.reconnectAttempts) {
      console.error(`[WS-RECONNECT] [${this.connectionId}] 达到最大重连次数`);
      this.emit('reconnectFailed');
      return;
    }

    this.currentAttempt++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.currentAttempt - 1);
    
    console.log(`[WS-RECONNECT] [${this.connectionId}] ${delay}ms 后重连...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // ==================== 心跳管理 ====================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 启动心跳检测...`);
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 配置: 间隔=${this.config.heartbeatInterval}ms, 超时=${this.config.heartbeatTimeout}ms`);
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 发送心跳数据包（iCode = "ping"）
        const heartbeatPacket = createWsPacket(HEARTBEAT_PING, {
          timestamp: Date.now()
        });
        
        console.log(`[WS-HEARTBEAT] [${this.connectionId}] 发送心跳请求 (ping):`, JSON.stringify(heartbeatPacket, null, 2));
        this.ws.send(JSON.stringify(heartbeatPacket));
        this.resetHeartbeatTimeout();
      }
    }, this.config.heartbeatInterval);
    
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] ═══════════════════════════════════`);
    
    // 立即发送第一次心跳
    if (this.ws?.readyState === WebSocket.OPEN) {
      const heartbeatPacket = createWsPacket(HEARTBEAT_PING, {
        timestamp: Date.now()
      });
      
      console.log(`[WS-HEARTBEAT] [${this.connectionId}] 立即发送第一次心跳:`, JSON.stringify(heartbeatPacket, null, 2));
      this.ws.send(JSON.stringify(heartbeatPacket));
      this.resetHeartbeatTimeout();
    }
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
    
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.error(`[WS-HEARTBEAT] [${this.connectionId}] 心跳超时`);
      this.ws?.close();
    }, this.config.heartbeatTimeout);
  }

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

  // ==================== 消息发送 ====================

  /**
   * 发送消息 - 使用 WsPacket 格式
   */
  public send(packet: WsPacket): void {
    console.log(`[WS-MESSAGE] [${this.connectionId}] 发送消息:`, JSON.stringify(packet, null, 2));

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        // 确保数据包有必要的字段，统一使用 WsPacket 结构
        const fullPacket: WsPacket = {
          iCode: String(packet.iCode),
          iType: String(packet.iType ?? '0'),
          iFrom: String(packet.iFrom ?? '0'),
          iTo: String(packet.iTo ?? '0'),
          iTime: packet.iTime || getCurrentTimeString(),
          iSelfData: packet.iSelfData
        };
        this.ws.send(JSON.stringify(fullPacket));
      } catch (error) {
        console.error(`[WS-MESSAGE] [${this.connectionId}] 消息发送失败:`, error);
      }
    } else {
      console.warn(`[WS-MESSAGE] [${this.connectionId}] 连接未就绪，消息加入队列`);
      this.messageQueue.push(packet);
      
      if (!this.isManualClose && this.currentAttempt < this.config.reconnectAttempts) {
        this.connect();
      }
    }
  }

  /**
   * 发送消息的简便方法（iCode 为数值，会转换为字符串）
   */
  public sendWithCode(iCode: number, iSelfData?: any): void {
    const packet = createWsPacket(String(iCode), iSelfData);
    this.send(packet);
  }

  /**
   * 发送队列中的消息
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`[WS-MESSAGE] [${this.connectionId}] 发送队列中的 ${this.messageQueue.length} 条消息...`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch {}
      }
    }
  }

  // ==================== 事件管理 ====================

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

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

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WS] [${this.connectionId}] '${event}' 事件处理器执行出错:`, error);
        }
      });
    }
  }

  // ==================== 连接控制 ====================

  public close(): void {
    console.log(`[WS] [${this.connectionId}] 执行手动关闭`);
    
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

  public destroy(): void {
    console.log(`[WS] [${this.connectionId}] 销毁 WebSocket 实例`);
    
    this.close();
    this.eventHandlers.clear();
    this.messageQueue = [];
  }
}

// 导出
export { WebSocketService, MessageCode };
export default WebSocketService;
