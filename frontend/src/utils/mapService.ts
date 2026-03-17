/**
 * 地图服务工具类
 * 用于处理iframe与地图服务之间的通信
 */

import { MAP_CONFIG, DEBUG_CONFIG } from '@/config';

/**
 * 地图消息类型定义
 */
export enum MapMessageType {
  // 来自地图的消息
  MAP_READY = 'MAP_READY',
  MAP_CLICK = 'MAP_CLICK',
  LOCATION_SELECTED = 'LOCATION_SELECTED',
  TARGET_UPDATE = 'TARGET_UPDATE',
  ERROR = 'MAP_ERROR',
  
  // 发送到地图的消息
  INIT = 'INIT',
  SET_CENTER = 'SET_CENTER',
  ADD_MARKER = 'ADD_MARKER',
  REMOVE_MARKER = 'REMOVE_MARKER',
  SET_ZOOM = 'SET_ZOOM',
  GET_LOCATION = 'GET_LOCATION',
  FLY_TO = 'FLY_TO',
}

/**
 * 地图消息接口
 */
export interface MapMessage {
  type: MapMessageType;
  payload?: any;
  timestamp?: number;
}

/**
 * 地图目标数据
 */
export interface MapTarget {
  id: string;
  type: 'drone' | 'pilot' | 'noFlyZone' | 'landmark';
  longitude: number;
  latitude: number;
  altitude?: number;
  top?: string;
  left?: string;
  snCode?: string;
  model?: string;
}

/**
 * 地图服务事件回调类型
 */
export type MapEventCallback = (message: MapMessage) => void;

/**
 * 地图服务类
 */
class MapService {
  private iframe: HTMLIFrameElement | null = null;
  private isReady: boolean = false;
  private callbacks: Map<string, MapEventCallback[]> = new Map();
  private initPromise: Promise<void> | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  /**
   * 初始化地图服务
   * @param iframe iframe元素
   * @returns Promise<void>
   */
  async init(iframe: HTMLIFrameElement): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      this.iframe = iframe;
      
      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error('地图服务加载超时'));
      }, MAP_CONFIG.LOAD_TIMEOUT);

      // 监听iframe加载完成
      iframe.onload = () => {
        if (DEBUG_CONFIG.ENABLED) {
          console.log('[MapService] iframe加载完成');
        }
        
        // 设置消息监听
        this.setupMessageListener();
        
        // 等待地图服务就绪消息
        this.on(MapMessageType.MAP_READY, () => {
          clearTimeout(timeout);
          this.isReady = true;
          if (DEBUG_CONFIG.ENABLED) {
            console.log('[MapService] 地图服务已就绪');
          }
          resolve();
        });

        // 主动发送初始化消息
        this.sendToMap({
          type: MapMessageType.INIT,
          payload: { source: 'handheld-device' }
        });
      };

      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('地图服务加载失败'));
      };
    });

    return this.initPromise;
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    // 移除旧的监听器
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }

    this.messageListener = (event: MessageEvent) => {
      // 安全检查：验证消息来源
      if (!this.isValidOrigin(event.origin)) {
        return;
      }

      const message = event.data as MapMessage;
      if (!message || !message.type) {
        return;
      }

      if (DEBUG_CONFIG.ENABLED) {
        console.log('[MapService] 收到消息:', message);
      }

      // 触发对应的回调
      this.emit(message.type, message);
    };

    window.addEventListener('message', this.messageListener);
  }

  /**
   * 验证消息来源是否有效
   */
  private isValidOrigin(origin: string): boolean {
    // 允许地图服务地址
    if (origin === MAP_CONFIG.ACTUAL_URL) {
      return true;
    }
    // 允许同源
    if (origin === window.location.origin) {
      return true;
    }
    // 调试模式下允许所有来源
    if (DEBUG_CONFIG.ENABLED) {
      return true;
    }
    return false;
  }

  /**
   * 向地图发送消息
   */
  sendToMap(message: MapMessage): boolean {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.error('[MapService] iframe未初始化');
      return false;
    }

    try {
      this.iframe.contentWindow.postMessage(message, MAP_CONFIG.ACTUAL_URL);
      return true;
    } catch (error) {
      console.error('[MapService] 发送消息失败:', error);
      return false;
    }
  }

  /**
   * 调用地图服务中的window函数
   * 注意：此方法需要iframe同源或设置适当的CORS策略
   * @param functionName 函数名
   * @param args 参数
   */
  callMapFunction(functionName: string, ...args: any[]): any {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.error('[MapService] iframe未初始化');
      return null;
    }

    try {
      const win = this.iframe.contentWindow as any;
      if (typeof win[functionName] === 'function') {
        return win[functionName](...args);
      } else if (DEBUG_CONFIG.ENABLED) {
        console.warn(`[MapService] 函数 ${functionName} 不存在于iframe窗口`);
      }
    } catch (error) {
      console.error(`[MapService] 调用函数 ${functionName} 失败:`, error);
    }
    return null;
  }

  /**
   * 注册事件回调
   */
  on(event: MapMessageType, callback: MapEventCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  /**
   * 移除事件回调
   */
  off(event: MapMessageType, callback?: MapEventCallback): void {
    if (!callback) {
      this.callbacks.delete(event);
    } else {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: MapMessageType, message: MapMessage): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }

  /**
   * 设置地图中心点
   */
  setCenter(longitude: number, latitude: number): void {
    this.sendToMap({
      type: MapMessageType.SET_CENTER,
      payload: { longitude, latitude }
    });
  }

  /**
   * 添加目标标记
   */
  addMarker(target: MapTarget): void {
    this.sendToMap({
      type: MapMessageType.ADD_MARKER,
      payload: target
    });
  }

  /**
   * 移除目标标记
   */
  removeMarker(targetId: string): void {
    this.sendToMap({
      type: MapMessageType.REMOVE_MARKER,
      payload: { id: targetId }
    });
  }

  /**
   * 飞行到指定位置
   */
  flyTo(longitude: number, latitude: number, zoom?: number): void {
    this.sendToMap({
      type: MapMessageType.FLY_TO,
      payload: { longitude, latitude, zoom }
    });
  }

  /**
   * 获取当前位置
   */
  requestLocation(): void {
    this.sendToMap({
      type: MapMessageType.GET_LOCATION
    });
  }

  /**
   * 销毁地图服务
   */
  destroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    this.iframe = null;
    this.isReady = false;
    this.initPromise = null;
    this.callbacks.clear();
  }

  /**
   * 获取地图服务是否就绪
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * 获取地图URL
   */
  getMapUrl(): string {
    if (MAP_CONFIG.ENABLED) {
      return MAP_CONFIG.MAP_URL;
    }
    // 返回占位页面
    return '/map-placeholder.html';
  }
}

// 导出单例
export const mapService = new MapService();

export default mapService;
