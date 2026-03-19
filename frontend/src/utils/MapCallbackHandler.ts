/**
 * 地图回调处理器工具类
 * 统一处理 iframe 地图的回调事件和主动触发地图事件
 * 可被 composable 调用或直接使用
 */

import { MAP_CONFIG } from '@/config';

// ========================================
// 类型定义
// ========================================

export interface MapCallbacks {
  // 地图生命周期
  loadComplete?: () => void;
  mapLoaded?: () => void;
  
  // 地图交互事件
  selectOther?: () => void;
  selectRight_ClickOther?: () => void;
  onLocationSelected?: (data: any) => void;
  mouseLocation?: (locationStr: string) => void;
  
  // 目标相关事件
  onTargetClick?: (targetId: string) => void;
  onPilotClick?: (data: any) => void;
  
  // 自定义回调
  [key: string]: ((...args: any[]) => void) | undefined;
}

export interface MapLocationData {
  longitude?: number | string;
  latitude?: number | string;
  altitude?: number;
  [key: string]: any;
}

// ========================================
// 地图回调处理器类
// ========================================

export class MapCallbackHandler {
  private iframe: HTMLIFrameElement | null = null;
  private callbacks: MapCallbacks = {};
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isDestroyed: boolean = false;
  private isReady: boolean = false;

  // ========================================
  // 初始化
  // ========================================

  /**
   * 初始化回调处理器
   * @param iframe 地图 iframe 元素
   * @param callbacks 回调方法集合
   */
  init(iframe: HTMLIFrameElement, callbacks: MapCallbacks = {}): void {
    this.iframe = iframe;
    this.callbacks = { ...callbacks };
    this.setupMessageListener();
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    if (this.isDestroyed) return;

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

  // ========================================
  // 消息处理
  // ========================================

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
      this.callbacks.mapLoaded?.();
    } else if (data.type === 'MAP_READY') {
      console.log('[MapCallbackHandler] 地图服务就绪');
      this.isReady = true;
    }
  }

  // ========================================
  // 回调管理
  // ========================================

  /**
   * 设置回调方法
   */
  setCallbacks(callbacks: MapCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 获取当前回调方法
   */
  getCallbacks(): MapCallbacks {
    return { ...this.callbacks };
  }

  /**
   * 清除所有回调
   */
  clearCallbacks(): void {
    this.callbacks = {};
  }

  // ========================================
  // 初始化地图
  // ========================================

  /**
   * 发送回调方法注册到地图
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
   * 初始化地图（调用 initView_3d）
   */
  initMap(): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const iframeWindow = this.iframe.contentWindow as any;

    // 发送初始化消息
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'map-handler'
    }, '*');

    // 调用初始化函数
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      this.isReady = true;
      console.log('[MapCallbackHandler] 地图初始化函数 initView_3d 调用成功');
      return true;
    } else {
      console.warn('[MapCallbackHandler] 地图初始化函数 initView_3d 不存在');
      return false;
    }
  }

  /**
   * 执行完整的地图初始化（带重试机制）
   */
  initialize(): void {
    // 注册回调
    this.initMapCallbacks();
    
    // 初始化地图
    this.initMap();

    // 重试机制
    setTimeout(() => {
      const win = this.iframe?.contentWindow as any;
      if (win && typeof win.initView_3d !== 'function') {
        console.log('[MapCallbackHandler] 重试初始化地图...');
        this.initMap();
      }
    }, MAP_CONFIG.INIT_RETRY_DELAY);
  }

  // ========================================
  // 主动触发地图事件
  // ========================================

  /**
   * 发送消息到地图
   */
  sendToMap(eventType: string, payload?: any): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    this.iframe.contentWindow.postMessage({
      type: eventType,
      payload,
      source: 'map-handler'
    }, '*');
  }

  /**
   * 启用位置拾取模式
   */
  startPickLocation(): void {
    this.sendToMap('START_PICK_LOCATION');
  }

  /**
   * 调用地图窗口函数
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
   * 飞行到指定位置
   */
  flyTo(longitude: number, latitude: number, zoom?: number): void {
    this.sendToMap('FLY_TO', { longitude, latitude, zoom });
  }

  /**
   * 添加标记
   */
  addMarker(marker: any): void {
    this.sendToMap('ADD_MARKER', marker);
  }

  /**
   * 移除标记
   */
  removeMarker(markerId: string): void {
    this.sendToMap('REMOVE_MARKER', { id: markerId });
  }

  /**
   * 设置地图中心点
   */
  setCenter(longitude: number, latitude: number): void {
    this.sendToMap('SET_CENTER', { longitude, latitude });
  }

  // ========================================
  // 工具方法
  // ========================================

  /**
   * 解析鼠标位置字符串
   * @param locationStr 格式: "经度 xxx°，纬度 xxx°"
   */
  static parseLocation(locationStr: string): { longitude: number; latitude: number } | null {
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

  // ========================================
  // 生命周期
  // ========================================

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.isDestroyed = true;
    this.removeMessageListener();
    this.iframe = null;
    this.callbacks = {};
    this.isReady = false;
  }

  /**
   * 获取 iframe 元素
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

  /**
   * 检查地图是否就绪
   */
  isMapReady(): boolean {
    return this.isReady;
  }
}

// ========================================
// 工厂函数
// ========================================

/**
 * 创建地图回调处理器实例
 */
export function createMapCallbackHandler(): MapCallbackHandler {
  return new MapCallbackHandler();
}

export default MapCallbackHandler;
