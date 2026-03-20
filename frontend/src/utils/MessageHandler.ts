/**
 * WebSocket 消息处理类
 * 负责解析、验证和分发 WebSocket 消息
 */

// ========================================
// 类型定义
// ========================================

/** 消息头部 - 公共头部属性 */
export interface MessageHeader {
  type: string;      // 消息类型，用于区别不同类型的消息
  data?: any;         // 自定义消息内容（JSON格式数据）
}

/** 消息结果 */
export interface MessageResult<T = any> {
  success: boolean;
  type?: string;
  data?: T;
  error?: string;
  rawData?: any;
}

/** 消息处理器接口 */
export interface MessageHandlerInterface {
  handleMessage(message: any): MessageResult;
}

/** 特定类型消息处理器 */
export type MessageTypeHandler<T = any> = (data: T) => void;

/** 错误回调 */
export type ErrorCallback = (error: string, rawData: any) => void;

// ========================================
// 消息处理类
// ========================================

export class MessageHandler implements MessageHandlerInterface {
  // 消息处理器映射表
  private handlers: Map<string, MessageTypeHandler> = new Map();
  
  // 错误回调
  private errorCallbacks: ErrorCallback[] = [];
  
  // JSON 解析错误信息
  private readonly JSON_PARSE_ERROR = 'Invalid JSON format';
  private readonly INVALID_STRUCTURE_ERROR = 'Invalid message structure: missing required fields';

  constructor() {
    // 初始化默认处理器
    this.initDefaultHandlers();
  }

  /**
   * 初始化默认处理器
   */
  private initDefaultHandlers(): void {
    // 注册已知的消息类型处理器
    this.registerHandler('stUAVTargetReport', this.handleUAVTargetReport.bind(this));
  }

  /**
   * 处理消息
   * @param message 原始消息数据
   * @returns 消息处理结果
   */
  handleMessage(message: any): MessageResult {
    // 1. 验证是否为字符串
    if (typeof message !== 'string') {
      return this.createErrorResult('Message must be a string', message);
    }

    // 2. 解析 JSON
    let parsedData: MessageHeader;
    try {
      parsedData = JSON.parse(message);
    } catch (error) {
      return this.createErrorResult(this.JSON_PARSE_ERROR, message);
    }

    // 3. 验证消息结构
    if (!this.validateMessageStructure(parsedData)) {
      return this.createErrorResult(this.INVALID_STRUCTURE_ERROR, message);
    }

    // 4. 获取消息类型
    const { type, data } = parsedData;

    // 5. 检查是否有对应的处理器
    const handler = this.handlers.get(type);
    if (handler) {
      try {
        // 执行处理器
        handler(data);
        return {
          success: true,
          type,
          data,
          rawData: parsedData
        };
      } catch (error) {
        return {
          success: false,
          type,
          data,
          error: error instanceof Error ? error.message : 'Handler execution failed',
          rawData: parsedData
        };
      }
    }

    // 6. 无对应处理器，记录警告但不报错
    console.warn(`[MessageHandler] No handler registered for message type: ${type}`);
    return {
      success: true,
      type,
      data,
      rawData: parsedData
    };
  }

  /**
   * 验证消息结构
   * @param data 解析后的数据
   * @returns 是否有效
   */
  private validateMessageStructure(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // 必须有 type 字段，且为字符串
    if (typeof data.type !== 'string' || data.type.trim() === '') {
      return false;
    }
    
    return true;
  }

  /**
   * 创建错误结果
   * @param error 错误信息
   * @param rawData 原始数据
   * @returns 错误结果
   */
  private createErrorResult(error: string, rawData: any): MessageResult {
    // 触发错误回调
    this.notifyError(error, rawData);
    
    return {
      success: false,
      error,
      rawData
    };
  }

  /**
   * 触发错误回调
   * @param error 错误信息
   * @param rawData 原始数据
   */
  private notifyError(error: string, rawData: any): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, rawData);
      } catch (e) {
        console.error('[MessageHandler] Error callback failed:', e);
      }
    });
  }

  /**
   * 注册消息处理器
   * @param type 消息类型
   * @param handler 处理器函数
   */
  registerHandler<T = any>(type: string, handler: MessageTypeHandler<T>): void {
    if (typeof type !== 'string' || type.trim() === '') {
      console.error('[MessageHandler] Invalid message type');
      return;
    }
    if (typeof handler !== 'function') {
      console.error('[MessageHandler] Handler must be a function');
      return;
    }
    this.handlers.set(type, handler as MessageTypeHandler);
    console.log(`[MessageHandler] Registered handler for type: ${type}`);
  }

  /**
   * 移除消息处理器
   * @param type 消息类型
   */
  unregisterHandler(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * 添加错误回调
   * @param callback 错误回调函数
   */
  addErrorCallback(callback: ErrorCallback): void {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }

  /**
   * 移除错误回调
   * @param callback 错误回调函数
   */
  removeErrorCallback(callback: ErrorCallback): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取已注册的消息类型列表
   * @returns 消息类型数组
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查是否有指定类型的处理器
   * @param type 消息类型
   * @returns 是否有处理器
   */
  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }

  // ========================================
  // 特定消息类型处理器
  // ========================================

  /**
   * 处理无人机目标报告消息
   * @param data 消息数据
   */
  private handleUAVTargetReport(data: any): void {
    console.log('[MessageHandler] Handling UAV Target Report:', data);
    
    // 数据验证
    if (!data) {
      console.warn('[MessageHandler] UAV Target Report: empty data');
      return;
    }

    // 根据实际数据结构进行相应处理
    // 示例：data 可能包含无人机目标的完整信息
    // {
    //   targetId: string,
    //   longitude: number,
    //   latitude: number,
    //   altitude: number,
    //   speed: number,
    //   heading: number,
    //   ...
    // }
    
    // TODO: 根据业务需求实现具体的处理逻辑
    // 例如：更新目标列表、触发告警、记录日志等
  }
}

// ========================================
// WebSocket 消息处理器（集成版）
// ========================================

export class WebSocketMessageHandler {
  private ws: WebSocket | null = null;
  private messageHandler: MessageHandler;

  constructor() {
    this.messageHandler = new MessageHandler();
  }

  /**
   * 绑定 WebSocket 连接
   * @param ws WebSocket 实例
   */
  bindWebSocket(ws: WebSocket): void {
    this.ws = ws;
  }

  /**
   * 解绑 WebSocket 连接
   */
  unbindWebSocket(): void {
    this.ws = null;
  }

  /**
   * 处理接收到的消息
   * @param event MessageEvent 事件
   * @returns 消息处理结果
   */
  handleReceivedMessage(event: MessageEvent): MessageResult {
    const message = event.data;
    
    // 解析消息
    const result = this.messageHandler.handleMessage(message);
    
    // 如果是错误结果，需要原路返回给发送端
    if (!result.success) {
      this.sendErrorResponse(result);
    }
    
    return result;
  }

  /**
   * 发送错误响应给发送端
   * @param result 错误结果
   */
  private sendErrorResponse(result: MessageResult): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketMessageHandler] Cannot send error response: WebSocket not connected');
      return;
    }

    const errorResponse = {
      type: 'error',
      data: {
        message: result.error,
        originalType: result.type || 'unknown'
      }
    };

    try {
      this.ws.send(JSON.stringify(errorResponse));
      console.log('[WebSocketMessageHandler] Error response sent to client');
    } catch (error) {
      console.error('[WebSocketMessageHandler] Failed to send error response:', error);
    }
  }

  /**
   * 发送消息
   * @param type 消息类型
   * @param data 消息数据
   */
  sendMessage(type: string, data?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketMessageHandler] Cannot send message: WebSocket not connected');
      return;
    }

    const message: MessageHeader = {
      type,
      data
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocketMessageHandler] Failed to send message:', error);
    }
  }

  /**
   * 注册消息处理器
   * @param type 消息类型
   * @param handler 处理器函数
   */
  registerHandler<T = any>(type: string, handler: MessageTypeHandler<T>): void {
    this.messageHandler.registerHandler(type, handler);
  }

  /**
   * 添加错误回调
   * @param callback 错误回调函数
   */
  addErrorCallback(callback: ErrorCallback): void {
    this.messageHandler.addErrorCallback(callback);
  }

  /**
   * 获取消息处理器实例
   * @returns MessageHandler 实例
   */
  getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }
}

// ========================================
// 工厂函数
// ========================================

/**
 * 创建消息处理器
 */
export function createMessageHandler(): MessageHandler {
  return new MessageHandler();
}

/**
 * 创建 WebSocket 消息处理器
 */
export function createWebSocketMessageHandler(): WebSocketMessageHandler {
  return new WebSocketMessageHandler();
}

// ========================================
// 默认导出
// ========================================

export default MessageHandler;
