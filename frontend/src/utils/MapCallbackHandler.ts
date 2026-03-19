/**
 * 地图回调处理器
 * 统一处理地图iframe的回调事件和主动触发地图事件
 */

import { MAP_CONFIG } from '@/config';

export interface MapCallbacks {
  loadComplete?: () => void;
  selectOther?: () => void;
  selectRight_ClickOther?: () => void;
  onLocationSelected?: (data: any) => void;
  mouseLocation?: (locationStr: string) => void;
  [key: string]: ((...args: any[]) => void) | undefined;
}

export interface MapLocationData {
  longitude?: number;
  latitude?: number;
  [key: string]: any;
}

/**
 * 地图回调处理类
 */
export class MapCallbackHandler {
  private iframe: HTMLIFrameElement | null = null;
  private callbacks: MapCallbacks = {};
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isDestroyed: boolean = false;

  /**
   * 初始化回调处理器
   * @param iframe 地图iframe元素
   * @param callbacks 回调方法集合
   */
  init(iframe: HTMLIFrameElement, callbacks: MapCallbacks = {}): void {
    this.iframe = iframe;
    this.callbacks = callbacks;
    this.setupMessageListener();
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    if (this.isDestroyed) return;

    // 移除旧的监听器
    this.removeMessageListener();

    this.messageHandler = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * 移除消息监听器
   */
  private removeMessageListener(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
  }

  /**
   * 处理来自地图的消息
   */
  private handleMessage(event: MessageEvent): void {
    const data = event.data;
    if (!data || !data.type) return;

    // 解析回调类型：CALLBACK_xxx -> xxx
    if (data.type.startsWith('CALLBACK_')) {
      const callbackName = data.type.replace('CALLBACK_', '');
      const callback = this.callbacks[callbackName];

      if (typeof callback === 'function') {
        const args = data.args || [];
        callback(...args);
      }
    } else if (data.type === 'MAP_LOADED') {
      console.log('[MapCallbackHandler] 地图页面加载完成');
    }
  }

  /**
   * 注册回调方法
   */
  setCallbacks(callbacks: MapCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 获取回调方法
   */
  getCallbacks(): MapCallbacks {
    return { ...this.callbacks };
  }

  /**
   * 初始化地图回调（发送回调方法列表到地图）
   */
  initMapCallbacks(): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    const methodNames = Object.keys(this.callbacks).filter(
      key => typeof this.callbacks[key] === 'function'
    );

    this.iframe.contentWindow.postMessage({
      type: 'INIT_CALLBACK',
      methods: methodNames
    }, '*');

    console.log('[MapCallbackHandler] 已注册回调方法:', methodNames);
  }

  /**
   * 初始化地图（调用initView_3d）
   */
  initMap(): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const iframeWindow = this.iframe.contentWindow as any;

    // 通过postMessage发送初始化请求
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'callback-handler'
    }, '*');

    // 尝试调用initView_3d
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      console.log('[MapCallbackHandler] 地图初始化函数 initView_3d 调用成功');
      return true;
    } else {
      console.warn('[MapCallbackHandler] 地图初始化函数 initView_3d 不存在');
      return false;
    }
  }

  /**
   * 启用位置拾取模式
   */
  startPickLocation(): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    this.iframe.contentWindow.postMessage({
      type: 'START_PICK_LOCATION',
      source: 'callback-handler'
    }, '*');
  }

  /**
   * 主动触发地图事件
   * @param eventType 事件类型
   * @param payload 事件数据
   */
  emitToMap(eventType: string, payload?: any): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    this.iframe.contentWindow.postMessage({
      type: eventType,
      payload: payload,
      source: 'callback-handler'
    }, '*');
  }

  /**
   * 调用地图窗口函数
   * @param functionName 函数名
   * @param args 参数
   */
  callMapFunction(functionName: string, ...args: any[]): any {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return null;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win[functionName] === 'function') {
      return win[functionName](...args);
    } else {
      console.warn(`[MapCallbackHandler] 函数 ${functionName} 不存在`);
      return null;
    }
  }

  /**
   * 解析鼠标位置字符串
   * @param locationStr 位置字符串，格式: "经度 xxx°，纬度 xxx°"
   * @returns 经纬度对象或null
   */
  static parseMouseLocation(locationStr: string): { longitude: number; latitude: number } | null {
    try {
      const lonMatch = locationStr.match(/经度\s*([\d.]+)°/);
      const latMatch = locationStr.match(/纬度\s*([\d.]+)°/);

      if (lonMatch && latMatch) {
        return {
          longitude: parseFloat(lonMatch[1]),
          latitude: parseFloat(latMatch[1])
        };
      }
    } catch (e) {
      console.warn('[MapCallbackHandler] 解析坐标失败:', e);
    }
    return null;
  }

  /**
   * 执行地图初始化（带重试机制）
   */
  initializeWithRetry(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.iframe?.contentWindow) {
        resolve(false);
        return;
      }

      // 注册回调
      this.initMapCallbacks();

      // 初始化地图
      const success = this.initMap();

      // 重试机制
      setTimeout(() => {
        const win = this.iframe?.contentWindow as any;
        if (win && typeof win.initView_3d !== 'function') {
          console.log('[MapCallbackHandler] 重试初始化地图...');
          this.initMap();
        }
        resolve(success);
      }, MAP_CONFIG.INIT_RETRY_DELAY);
    });
  }

  /**
   * 销毁回调处理器
   */
  destroy(): void {
    this.isDestroyed = true;
    this.removeMessageListener();
    this.iframe = null;
    this.callbacks = {};
  }

  /**
   * 获取iframe元素
   */
  getIframe(): HTMLIFrameElement | null {
    return this.iframe;
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.iframe !== null && !this.isDestroyed;
  }
}

// 导出默认实例工厂函数
export function createMapCallbackHandler(): MapCallbackHandler {
  return new MapCallbackHandler();
}

export default MapCallbackHandler;
