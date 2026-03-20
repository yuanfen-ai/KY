/**
 * WebSocket 客户端服务
 * 提供 WebSocket 连接管理、心跳、自动重连等功能
 * 
 * 日志级别说明：
 * - [WS] - WebSocket 连接相关日志
 * - [WS-HEARTBEAT] - 心跳相关日志
 * - [WS-RECONNECT] - 重连相关日志
 * - [WS-MESSAGE] - 消息收发日志
 */

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
  private connectionId: string = '';

  constructor(config: WebSocketConfig) {
    // 生成连接ID用于日志追踪
    this.connectionId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[WS] [${this.connectionId}] ===== WebSocket 服务初始化 =====`);
    console.log(`[WS] [${this.connectionId}] 连接地址: ${config.url}`);
    console.log(`[WS] [${this.connectionId}] 重连次数: ${config.reconnectAttempts ?? 5}`);
    console.log(`[WS] [${this.connectionId}] 重连间隔: ${config.reconnectInterval ?? 3000}ms`);
    console.log(`[WS] [${this.connectionId}] 心跳间隔: ${config.heartbeatInterval ?? 30000}ms`);
    console.log(`[WS] [${this.connectionId}] 心跳超时: ${config.heartbeatTimeout ?? 5000}ms`);

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

  // ==================== 连接管理 ====================

  /**
   * 建立 WebSocket 连接
   */
  private connect(): void {
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS] [${this.connectionId}] 正在建立连接... (第 ${this.currentAttempt + 1} 次尝试)`);
    console.log(`[WS] [${this.connectionId}] 目标地址: ${this.config.url}`);
    console.log(`[WS] [${this.connectionId}] 当前状态: ${this.getState()}`);

    try {
      console.log(`[WS] [${this.connectionId}] 创建 WebSocket 实例...`);
      this.ws = new WebSocket(this.config.url);

      console.log(`[WS] [${this.connectionId}] 绑定事件监听器...`);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      console.log(`[WS] [${this.connectionId}] WebSocket 实例已创建，等待服务器响应...`);
    } catch (error) {
      console.error(`[WS] [${this.connectionId}] 创建 WebSocket 实例失败:`, error);
      console.log(`[WS-RECONNECT] [${this.connectionId}] 触发自动重连...`);
      this.attemptReconnect();
    }
  }

  /**
   * 连接成功处理
   */
  private handleOpen(): void {
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS] [${this.connectionId}] ✅ WebSocket 连接成功!`);
    console.log(`[WS] [${this.connectionId}] 连接状态: OPEN`);
    console.log(`[WS] [${this.connectionId}] 尝试次数: ${this.currentAttempt}`);
    
    this.currentAttempt = 0;
    this.isManualClose = false;
    
    // 发送队列中的消息
    const queueLength = this.messageQueue.length;
    if (queueLength > 0) {
      console.log(`[WS-MESSAGE] [${this.connectionId}] 发送队列中的 ${queueLength} 条消息...`);
    }
    this.flushMessageQueue();
    
    // 启动心跳
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 启动心跳检测...`);
    this.startHeartbeat();
    
    // 触发回调
    console.log(`[WS] [${this.connectionId}] 触发 onConnected 回调...`);
    this.config.onConnected();
    this.emit('connected');
    
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
  }

  /**
   * 接收消息处理
   */
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
      
      // 触发通用消息事件
      this.emit('message', data);
      
      // 触发特定类型的事件
      if (data.type) {
        this.emit(data.type, data);
      }
    } catch (error) {
      console.error(`[WS-MESSAGE] [${this.connectionId}] ❌ 消息解析失败:`, error);
    }
  }

  /**
   * 连接错误处理
   */
  private handleError(event: Event): void {
    console.error(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.error(`[WS] [${this.connectionId}] ❌ WebSocket 连接错误!`);
    console.error(`[WS] [${this.connectionId}] 错误类型: ${event.type}`);
    console.error(`[WS] [${this.connectionId}] 当前状态: ${this.getState()}`);
    
    this.config.onError(event);
    this.emit('error', event);
    
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
  }

  /**
   * 连接关闭处理
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS] [${this.connectionId}] ⚠️ WebSocket 连接已关闭`);
    console.log(`[WS] [${this.connectionId}] 关闭码: ${event.code}`);
    console.log(`[WS] [${this.connectionId}] 关闭原因: ${event.reason || '(无)'}`);
    console.log(`[WS] [${this.connectionId}] 是否手动关闭: ${this.isManualClose ? '是' : '否'}`);
    
    // 清理定时器
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 停止心跳检测...`);
    this.stopHeartbeat();
    
    // 触发回调
    console.log(`[WS] [${this.connectionId}] 触发 onDisconnected 回调...`);
    this.config.onDisconnected();
    this.emit('disconnected', event);
    
    // 自动重连（非手动关闭）
    if (!this.isManualClose) {
      console.log(`[WS-RECONNECT] [${this.connectionId}] 连接非手动关闭，准备重连...`);
      console.log(`[WS-RECONNECT] [${this.connectionId}] 当前尝试次数: ${this.currentAttempt}/${this.config.reconnectAttempts}`);
      this.attemptReconnect();
    } else {
      console.log(`[WS] [${this.connectionId}] 手动关闭，不进行重连`);
    }
    
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
  }

  // ==================== 重连管理 ====================

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.currentAttempt >= this.config.reconnectAttempts) {
      console.error(`[WS-RECONNECT] [${this.connectionId}] ❌ 达到最大重连次数 (${this.config.reconnectAttempts})，停止重连`);
      console.error(`[WS-RECONNECT] [${this.connectionId}] 请检查网络连接或服务器状态`);
      this.emit('reconnectFailed');
      return;
    }

    this.currentAttempt++;
    // 使用指数退避策略
    const delay = this.config.reconnectInterval * Math.pow(2, this.currentAttempt - 1);
    
    console.log(`[WS-RECONNECT] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS-RECONNECT] [${this.connectionId}] 计划重连 (第 ${this.currentAttempt} 次)`);
    console.log(`[WS-RECONNECT] [${this.connectionId}] 延迟时间: ${delay}ms`);
    console.log(`[WS-RECONNECT] [${this.connectionId}] 最大重试: ${this.config.reconnectAttempts} 次`);
    
    if (this.reconnectTimer) {
      console.log(`[WS-RECONNECT] [${this.connectionId}] 清除之前的重连定时器...`);
      clearTimeout(this.reconnectTimer);
    }
    
    console.log(`[WS-RECONNECT] [${this.connectionId}] 启动重连定时器...`);
    this.reconnectTimer = setTimeout(() => {
      console.log(`[WS-RECONNECT] [${this.connectionId}] 重连定时器触发，开始重连...`);
      this.connect();
    }, delay);
    
    console.log(`[WS-RECONNECT] [${this.connectionId}] ═══════════════════════════════════`);
  }

  // ==================== 心跳管理 ====================

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 配置: 间隔=${this.config.heartbeatInterval}ms, 超时=${this.config.heartbeatTimeout}ms`);
    
    this.stopHeartbeat();
    
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 启动心跳定时器 (间隔 ${this.config.heartbeatInterval}ms)...`);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingData = { type: 'ping', timestamp: Date.now() };
        console.log(`[WS-HEARTBEAT] [${this.connectionId}] 发送心跳 (ping)...`);
        this.ws.send(JSON.stringify(pingData));
        console.log(`[WS-HEARTBEAT] [${this.connectionId}] 心跳已发送，等待响应...`);
        this.resetHeartbeatTimeout();
      } else {
        console.warn(`[WS-HEARTBEAT] [${this.connectionId}] WebSocket 未连接 (状态: ${this.getState()})，跳过心跳`);
      }
    }, this.config.heartbeatInterval);
    
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] ═══════════════════════════════════`);
  }

  /**
   * 重置心跳超时
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
    
    if (this.heartbeatTimeoutTimer === null) {
      // 首次设置超时
      this.heartbeatTimeoutTimer = setTimeout(() => {
        console.error(`[WS-HEARTBEAT] [${this.connectionId}] ❌ 心跳超时! 未在 ${this.config.heartbeatTimeout}ms 内收到响应`);
        console.log(`[WS-HEARTBEAT] [${this.connectionId}] 关闭连接，触发重连...`);
        this.ws?.close();
      }, this.config.heartbeatTimeout);
    }
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log(`[WS-HEARTBEAT] [${this.connectionId}] 心跳定时器已停止`);
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
      console.log(`[WS-HEARTBEAT] [${this.connectionId}] 心跳超时定时器已停止`);
    }
  }

  // ==================== 消息发送 ====================

  /**
   * 发送消息
   */
  public send(payload: MessagePayload): void {
    console.log(`[WS-MESSAGE] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS-MESSAGE] [${this.connectionId}] 尝试发送消息`);
    console.log(`[WS-MESSAGE] [${this.connectionId}] 消息类型: ${payload.type}`);
    console.log(`[WS-MESSAGE] [${this.connectionId}] 消息内容:`, payload);
    console.log(`[WS-MESSAGE] [${this.connectionId}] 当前状态: ${this.getState()}`);

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(payload);
        this.ws.send(messageStr);
        console.log(`[WS-MESSAGE] [${this.connectionId}] ✅ 消息发送成功`);
        console.log(`[WS-MESSAGE] [${this.connectionId}] 发送数据: ${messageStr}`);
      } catch (error) {
        console.error(`[WS-MESSAGE] [${this.connectionId}] ❌ 消息发送失败:`, error);
      }
    } else {
      console.warn(`[WS-MESSAGE] [${this.connectionId}] ⚠️ 连接未就绪 (状态: ${this.getState()})，消息加入队列`);
      console.log(`[WS-MESSAGE] [${this.connectionId}] 队列长度: ${this.messageQueue.length + 1}`);
      this.messageQueue.push(payload);
      
      // 触发重连
      if (!this.isManualClose && this.currentAttempt < this.config.reconnectAttempts) {
        console.log(`[WS-MESSAGE] [${this.connectionId}] 触发自动重连...`);
        this.connect();
      }
    }
    console.log(`[WS-MESSAGE] [${this.connectionId}] ═══════════════════════════════════`);
  }

  /**
   * 发送队列中的消息
   */
  private flushMessageQueue(): void {
    const queueLength = this.messageQueue.length;
    
    if (queueLength === 0) {
      console.log(`[WS-MESSAGE] [${this.connectionId}] 发送队列为空，无需处理`);
      return;
    }

    console.log(`[WS-MESSAGE] [${this.connectionId}] 开始发送队列中的 ${queueLength} 条消息...`);
    
    let successCount = 0;
    let failCount = 0;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
          successCount++;
        } catch {
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    console.log(`[WS-MESSAGE] [${this.connectionId}] 队列消息发送完成: 成功=${successCount}, 失败=${failCount}`);
  }

  // ==================== 事件管理 ====================

  /**
   * 注册事件监听
   */
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
      console.log(`[WS] [${this.connectionId}] 新建事件监听器集合: '${event}'`);
    } else {
      console.log(`[WS] [${this.connectionId}] 添加事件监听器: '${event}'`);
    }
    this.eventHandlers.get(event)!.add(handler);
    console.log(`[WS] [${this.connectionId}] '${event}' 监听器数量: ${this.eventHandlers.get(event)!.size}`);
  }

  /**
   * 移除事件监听
   */
  public off(event: string, handler?: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
        console.log(`[WS] [${this.connectionId}] 移除 '${event}' 的特定监听器`);
      } else {
        handlers.clear();
        console.log(`[WS] [${this.connectionId}] 移除 '${event}' 的所有监听器`);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers && handlers.size > 0) {
      console.log(`[WS] [${this.connectionId}] 触发 '${event}' 事件，共 ${handlers.size} 个监听器`);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WS] [${this.connectionId}] '${event}' 事件处理器执行出错:`, error);
        }
      });
    } else {
      console.log(`[WS] [${this.connectionId}] '${event}' 事件无监听器`);
    }
  }

  // ==================== 连接控制 ====================

  /**
   * 手动关闭连接
   */
  public close(): void {
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS] [${this.connectionId}] 执行手动关闭...`);
    
    this.isManualClose = true;
    
    console.log(`[WS-HEARTBEAT] [${this.connectionId}] 停止心跳...`);
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      console.log(`[WS-RECONNECT] [${this.connectionId}] 清除重连定时器...`);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      console.log(`[WS] [${this.connectionId}] 关闭 WebSocket 连接 (code: 1000)`);
      this.ws.close(1000, 'Manual close');
      this.ws = null;
    } else {
      console.log(`[WS] [${this.connectionId}] WebSocket 实例不存在`);
    }
    
    console.log(`[WS] [${this.connectionId}] 手动关闭完成`);
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
  }

  /**
   * 获取连接状态
   */
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

  /**
   * 获取连接信息
   */
  public getConnectionInfo(): object {
    return {
      connectionId: this.connectionId,
      url: this.config.url,
      state: this.getState(),
      currentAttempt: this.currentAttempt,
      maxAttempts: this.config.reconnectAttempts,
      queueLength: this.messageQueue.length,
      isManualClose: this.isManualClose,
    };
  }

  /**
   * 销毁实例
   */
  public destroy(): void {
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
    console.log(`[WS] [${this.connectionId}] 销毁 WebSocket 实例...`);
    
    this.close();
    
    console.log(`[WS] [${this.connectionId}] 清空事件监听器...`);
    this.eventHandlers.clear();
    
    console.log(`[WS] [${this.connectionId}] 清空消息队列 (${this.messageQueue.length} 条)...`);
    this.messageQueue = [];
    
    console.log(`[WS] [${this.connectionId}] ✅ 销毁完成`);
    console.log(`[WS] [${this.connectionId}] ═══════════════════════════════════`);
  }
}

// ==================== 导出 ====================

// 命名导出
export { WebSocketService };

// 默认导出
export default WebSocketService;
