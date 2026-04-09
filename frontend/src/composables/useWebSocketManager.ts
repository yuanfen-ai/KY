/**
 * WebSocket 管理器
 * 统一管理 WebSocket 客户端的生命周期
 * - 登录后启动
 * - 退出/关闭时释放资源
 */

import { ref, onUnmounted } from 'vue';
import WebSocketService from '@/utils/websocket';
import { messageHandler } from '@/utils/MessageHandler';
import type { WebSocketConfig } from '@/utils';

// WebSocket 服务接口（用于类型安全）
interface IWebSocketService {
  send(payload: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler?: Function): void;
  close(): void;
}

// 默认配置
const DEFAULT_CONFIG: Partial<WebSocketConfig> = {
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 5000,
};

/**
 * WebSocket 管理器钩子
 * 在系统登录后调用 init() 启动，退出时调用 destroy() 关闭
 */
export function useWebSocketManager() {
  const wsService = ref<IWebSocketService | null>(null);
  const isInitialized = ref(false);
  const isConnected = ref(false);
  const connectionState = ref<string>('CLOSED');

  /**
   * 初始化 WebSocket 连接（登录后调用）
   * @param config WebSocket 配置
   */
  const init = (config: WebSocketConfig): void => {
    if (isInitialized.value) {
      console.warn('[WebSocketManager] WebSocket 已初始化，请先调用 destroy()');
      return;
    }

    console.log('[WebSocketManager] 正在初始化 WebSocket...');

    // 创建 WebSocket 服务
    const service = new WebSocketService({
      ...DEFAULT_CONFIG,
      ...config,
      onConnected: () => {
        isConnected.value = true;
        connectionState.value = 'OPEN';
        console.log('[WebSocketManager] WebSocket 连接成功');
        config.onConnected?.();
      },
      onDisconnected: () => {
        isConnected.value = false;
        connectionState.value = 'CLOSED';
        console.log('[WebSocketManager] WebSocket 连接断开');
        config.onDisconnected?.();
      },
      onMessage: (data: any) => {
        config.onMessage?.(data);
      },
      onError: (error: any) => {
        console.error('[WebSocketManager] WebSocket 错误:', error);
        config.onError?.(error);
      },
    });

    wsService.value = service;

    // 初始化消息处理器
    messageHandler.init(service as any);

    // 监听重连失败
    service.on('reconnectFailed', () => {
      console.error('[WebSocketManager] WebSocket 重连失败');
    });

    isInitialized.value = true;
  };

  /**
   * 销毁 WebSocket 连接（退出/关闭时调用）
   */
  const destroy = (): void => {
    if (!isInitialized.value || !wsService.value) {
      console.warn('[WebSocketManager] WebSocket 未初始化，无需销毁');
      return;
    }

    console.log('[WebSocketManager] 正在销毁 WebSocket...');

    // 销毁消息处理器
    messageHandler.destroy();

    // 关闭 WebSocket 连接
    wsService.value.close();
    wsService.value = null;

    isInitialized.value = false;
    isConnected.value = false;
    connectionState.value = 'CLOSED';

    console.log('[WebSocketManager] WebSocket 已销毁');
  };

  /**
   * 发送消息
   */
  const send = (type: string, data?: any): boolean => {
    if (!isInitialized.value || !wsService.value) {
      console.error('[WebSocketManager] WebSocket 未初始化');
      return false;
    }
    wsService.value.send({ type, data } as any);
    return true;
  };

  /**
   * 获取 WebSocket 服务实例（谨慎使用）
   */
  const getService = (): IWebSocketService | null => {
    return wsService.value;
  };

  /**
   * 重新连接
   */
  const reconnect = (): void => {
    if (wsService.value) {
      wsService.value.close();
    }
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    destroy();
  });

  return {
    init,
    destroy,
    send,
    reconnect,
    getService,
    isInitialized,
    isConnected,
    connectionState,
  };
}

// ==================== 全局 WebSocket 管理器 ====================

/**
 * 全局 WebSocket 管理器单例
 * 用于在非组件环境中管理 WebSocket 生命周期
 */
class WebSocketManager {
  private static instance: WebSocketManager;
  private wsService: IWebSocketService | null = null;
  private _isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * 初始化（登录后调用）
   */
  public init(config: WebSocketConfig): void {
    if (this.wsService) {
      console.warn('[WebSocketManager] WebSocket 已初始化，请先调用 destroy()');
      return;
    }

    console.log('[WebSocketManager] 正在初始化 WebSocket...');

    const service = new WebSocketService({
      ...DEFAULT_CONFIG,
      ...config,
      onConnected: () => {
        this._isConnected = true;
        console.log('[WebSocketManager] WebSocket 连接成功');
        config.onConnected?.();
      },
      onDisconnected: () => {
        this._isConnected = false;
        console.log('[WebSocketManager] WebSocket 连接断开');
        config.onDisconnected?.();
      },
      onMessage: (data: any) => {
        config.onMessage?.(data);
      },
      onError: (error: any) => {
        console.error('[WebSocketManager] WebSocket 错误:', error);
        config.onError?.(error);
      },
    });

    this.wsService = service;
    messageHandler.init(service as any);
  }

  /**
   * 销毁（退出时调用）
   */
  public destroy(): void {
    if (!this.wsService) {
      return;
    }

    console.log('[WebSocketManager] 正在销毁 WebSocket...');

    messageHandler.destroy();
    this.wsService.close();
    this.wsService = null;
    this._isConnected = false;

    console.log('[WebSocketManager] WebSocket 已销毁');
  }

  /**
   * 发送消息
   */
  public send(packet: any): boolean {
    if (!this.wsService) {
      console.error('[WebSocketManager] WebSocket 未初始化');
      return false;
    }
    this.wsService.send(packet);
    return true;
  }

  /**
   * 获取连接状态
   */
  public get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * 获取服务实例
   */
  public get service(): IWebSocketService | null {
    return this.wsService;
  }

  /**
   * 监听 WebSocket 消息
   */
  public on(handler: (data: any) => void): void {
    if (this.wsService) {
      this.wsService.on('message', handler);
    }
  }

  /**
   * 取消监听 WebSocket 消息
   */
  public off(handler: (data: any) => void): void {
    if (this.wsService) {
      this.wsService.off('message', handler);
    }
  }
}

// 导出全局管理器
export const globalWebSocketManager = WebSocketManager.getInstance();
