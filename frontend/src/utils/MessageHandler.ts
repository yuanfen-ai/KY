/**
 * WebSocket 消息处理器
 * 统一处理接收消息（心跳除外）和提供统一发送接口
 */

import type { WebSocketService } from './websocket';

// 消息处理器类型
export type MessageHandlerFn<T = any> = (data: T, rawMessage?: object) => void;

// 消息处理器注册项
interface HandlerEntry {
  handler: MessageHandlerFn;
  /** 是否需要返回结果给发送方 */
  needResponse?: boolean;
}

// 错误响应结构
interface ErrorResponse {
  code: number;
  message: string;
  originalType?: string;
}

/**
 * 消息处理结果
 */
export interface HandlerResult {
  success: boolean;
  data?: any;
  error?: ErrorResponse;
}

/**
 * 消息处理器单例
 * 统一处理 WebSocket 消息和提供发送接口
 */
class MessageHandler {
  private static instance: MessageHandler;
  private wsService: WebSocketService | null = null;
  private handlers: Map<string, HandlerEntry> = new Map();
  private defaultErrorHandler: MessageHandlerFn | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  /**
   * 初始化，绑定 WebSocket 服务
   * @param wsService WebSocketService 实例
   */
  public init(wsService: WebSocketService): void {
    this.wsService = wsService;
    
    // 监听消息事件（心跳 pong 已由 WebSocketService 处理）
    wsService.on('message', (data: any) => {
      this.handleMessage(data);
    });
  }

  /**
   * 注册消息处理器
   * @param type 消息类型
   * @param handler 处理函数
   * @param options 配置选项
   */
  public registerHandler<T = any>(
    type: string,
    handler: MessageHandlerFn<T>,
    options?: { needResponse?: boolean }
  ): void {
    this.handlers.set(type, {
      handler: handler as MessageHandlerFn,
      needResponse: options?.needResponse ?? false
    });
  }

  /**
   * 批量注册消息处理器
   * @param handlers 处理器映射表
   */
  public registerHandlers(handlers: Record<string, MessageHandlerFn>): void {
    Object.entries(handlers).forEach(([type, handler]) => {
      this.registerHandler(type, handler);
    });
  }

  /**
   * 设置默认错误处理器（处理未注册的消息类型）
   * @param handler 错误处理函数
   */
  public setDefaultErrorHandler(handler: MessageHandlerFn): void {
    this.defaultErrorHandler = handler;
  }

  /**
   * 统一发送消息
   * @param type 消息类型
   * @param data 消息数据
   * @returns 是否发送成功
   */
  public send(type: string, data?: any): boolean {
    if (!this.wsService) {
      console.error('[MessageHandler] 未初始化 WebSocket 服务');
      return false;
    }

    const payload = { type, ...(data !== undefined ? { data } : {}) };
    this.wsService.send(payload as any);
    return true;
  }

  /**
   * 发送需要响应请求的消息，并返回 Promise
   * @param type 消息类型
   * @param data 消息数据
   * @param timeout 超时时间(ms)
   * @returns Promise<HandlerResult>
   */
  public sendRequest(type: string, data?: any, timeout: number = 30000): Promise<HandlerResult> {
    return new Promise((resolve) => {
      if (!this.send(type, data)) {
        resolve({ success: false, error: { code: -1, message: '发送失败' } });
        return;
      }

      // 监听响应
      const responseType = `${type}Response`;
      const responseHandler = (response: any) => {
        if (response.type === responseType || response.type === `${type}_resp`) {
          this.wsService?.off(responseType, responseHandler);
          clearTimeout(timer);
          resolve({
            success: response.code === 0 || response.success,
            data: response.data,
            error: response.code !== 0 ? { code: response.code, message: response.message } : undefined
          });
        }
      };

      const timer = setTimeout(() => {
        this.wsService?.off('message', responseHandler);
        resolve({ success: false, error: { code: -2, message: '请求超时' } });
      }, timeout);

      this.wsService?.on(responseType, responseHandler);
    });
  }

  /**
   * 发送错误响应给发送方
   * @param originalMessage 原始消息
   * @param code 错误码
   * @param message 错误信息
   */
  public sendErrorResponse(originalMessage: { type?: string }, code: number, message: string): void {
    if (!this.wsService || !originalMessage.type) return;
    
    this.send(`${originalMessage.type}Response`, {
      code,
      message,
      success: false
    });
  }

  /**
   * 处理接收到的消息
   * @param message 消息对象
   */
  private handleMessage(message: any): void {
    // 验证消息格式
    if (!this.validateMessage(message)) {
      console.warn('[MessageHandler] 收到无效消息格式:', message);
      this.sendErrorResponse(message, 400, 'Invalid message format');
      return;
    }

    const { type, data } = message;

    // 查找对应的处理器
    const entry = this.handlers.get(type);

    if (entry) {
      try {
        entry.handler(data, message);
      } catch (error) {
        console.error(`[MessageHandler] 处理消息 ${type} 时出错:`, error);
        if (entry.needResponse) {
          this.sendErrorResponse(message, 500, 'Handler error');
        }
      }
    } else if (this.defaultErrorHandler) {
      this.defaultErrorHandler(data, message);
    } else {
      console.warn(`[MessageHandler] 未注册的消息类型: ${type}`);
    }
  }

  /**
   * 验证消息格式
   * @param message 消息对象
   */
  private validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') return false;
    if (typeof message.type !== 'string') return false;
    return true;
  }

  /**
   * 移除指定消息类型的处理器
   * @param type 消息类型
   */
  public removeHandler(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * 清空所有处理器
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }
}

// 导出单例
export const messageHandler = MessageHandler.getInstance();

// 导出便捷方法
export const registerHandler = <T = any>(
  type: string,
  handler: MessageHandlerFn<T>,
  options?: { needResponse?: boolean }
) => messageHandler.registerHandler(type, handler, options);

export const sendMessage = (type: string, data?: any) => messageHandler.send(type, data);

export const sendRequest = (type: string, data?: any, timeout?: number) => 
  messageHandler.sendRequest(type, data, timeout);
