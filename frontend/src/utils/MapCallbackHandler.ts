/**
 * 地图回调处理器工具类（核心逻辑层）
 * 统一处理 iframe 地图的回调事件和主动触发地图事件
 * 不依赖 Vue，可被 composable 或其他模块调用
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
  
  // 地图模型点击回调
  selectMarker?: (uniqueId: string, type: number, subtype: number, screen_x: number, screen_y: number, screen_z: number) => void;
  
  // 地图模型查询结果回调
  queryMarkerBack?: (flag: number, uniqueId: string, screen_x: number, screen_y: number) => void;
  
  // 禁飞区拾取回调
  selectDraggableDevLoc?: (keyId: string, devType: number, lng: string, lat: string) => void;
  
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
// 目标数据类型定义
// ========================================

/**
 * 定位目标上报数据
 */
export interface LocationTargetData {
  sID: string;          // SN码
  sAirType?: string;    // 机型
  iSpeedH?: number;     // 水平速度
  iSpeedV?: number;     // 垂直速度
  dbHeight?: number;    // 高度
  dbUavLng?: number;    // 无人机经度
  dbUavLat?: number;    // 无人机纬度
  dbPoliteLng?: number; // 飞手经度
  dbPoliteLat?: number; // 飞手纬度
  iFreq?: number;       // 频点
  sTime?: string;       // 时间
}

/**
 * 待处理目标项
 */
export interface PendingTargetItem {
  data: LocationTargetData;
  timestamp: number;
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
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  // ========================================
  // 目标管理
  // ========================================
  
  // 已创建的无人机目标 Set（用于跟踪地图上已存在的模型）
  private createdUavTargets: Set<string> = new Set();
  
  // 已创建的飞手目标 Set
  private createdPilotTargets: Set<string> = new Set();
  
  // 待处理的无人机目标队列（地图未就绪时缓存）
  private pendingUavTargets: PendingTargetItem[] = [];
  
  // 待处理的飞手目标队列
  private pendingPilotTargets: PendingTargetItem[] = [];
  
  // 队列处理间隔（毫秒）
  private readonly QUEUE_PROCESS_INTERVAL = 50;
  
  // 队列处理延迟（地图就绪后延迟多久开始处理）
  private readonly QUEUE_PROCESS_DELAY = 500;

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
        console.log(`[MapCallbackHandler] 收到回调 ${callbackName}:`, args);
        callback(...args);
      }
    } else if (data.type === 'MAP_LOADED') {
      console.log('[MapCallbackHandler] 地图页面加载完成');
      this.callbacks.mapLoaded?.();
    } else if (data.type === 'MAP_READY') {
      console.log('[MapCallbackHandler] 地图服务就绪');
      this.isReady = true;
    } else if (data.type === 'SELECT_DRAGGABLE_DEV_LOC') {
      // 处理禁飞区位置选择回调
      const { keyId, devType, lng, lat } = data.payload || {};
      console.log('[MapCallbackHandler] 收到禁飞区位置选择:', { keyId, devType, lng, lat });
      this.callbacks.selectDraggableDevLoc?.(keyId, devType, lng, lat);
    }
  }

  // ========================================
  // 回调管理
  // ========================================

  /**
   * 更新回调方法（不立即设置到 iframe）
   */
  updateCallbacks(callbacks: MapCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
    console.log('[MapCallbackHandler] 已更新回调:', Object.keys(callbacks));
  }

  /**
   * 设置回调方法并同步到 callbackObj
   */
  setCallbacks(callbacks: MapCallbacks): void {
    this.updateCallbacks(callbacks);
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
  // callbackObj 管理（核心逻辑）
  // ========================================

  /**
   * 初始化 callbackObj 并设置到 iframe
   * 这是关键方法，确保地图服务能正确调用我们的回调
   */
  initMapCallbacks(): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    const methodNames = Object.keys(this.callbacks).filter(
      key => typeof this.callbacks[key] === 'function'
    );

    console.log('[MapCallbackHandler] ========== initMapCallbacks 开始 ==========');
    console.log('[MapCallbackHandler] 当前已注册的回调方法:', methodNames);
    console.log('[MapCallbackHandler] callbacks 对象:', this.callbacks);

    if (methodNames.length === 0) {
      console.warn('[MapCallbackHandler] 没有回调方法需要注册！');
      return;
    }

    // 创建或获取 callbackObj 对象
    if (!(window as any).callbackObj) {
      (window as any).callbackObj = {};
    }

    // 将回调函数挂载到 window.callbackObj 上，供地图 iframe 调用
    methodNames.forEach(methodName => {
      (window as any).callbackObj[methodName] = (...args: any[]) => {
        console.log(`[MapCallbackHandler] 收到地图回调 ${methodName}:`, args);
        
        // 特殊处理：loadComplete 回调表示地图资源加载完成
        if (methodName === 'loadComplete') {
          console.log('[MapCallbackHandler] 🎯 地图资源加载完成 (loadComplete 回调触发)');
          this.isReady = true;
          
          // 清空目标跟踪 Set（地图重新加载后内部目标已被重置）
          this.createdUavTargets.clear();
          this.createdPilotTargets.clear();
          console.log('[MapCallbackHandler] 已清空目标跟踪 Set');
          
          // 延迟处理待处理队列
          setTimeout(() => {
            this.processPendingQueues();
          }, this.QUEUE_PROCESS_DELAY);
        }
        
        if (this.callbacks[methodName]) {
          (this.callbacks[methodName] as Function)(...args);
        }
      };
      // 同时挂载到 window 上
      (window as any)[methodName] = (window as any).callbackObj[methodName];
    });

    console.log('[MapCallbackHandler] window.callbackObj 内容:', Object.keys((window as any).callbackObj));

    // 获取 iframe window
    const iframeWin = this.iframe.contentWindow as any;
    
    // 合并或设置 callbackObj 到 iframe
    this.mergeCallbackObjToIframe(iframeWin);

    // 发送初始化回调消息
    this.iframe.contentWindow.postMessage({
      type: 'INIT_CALLBACK',
      methods: methodNames
    }, '*');

    console.log('[MapCallbackHandler] 已注册回调方法到 window.callbackObj:', methodNames);
    
    // 设置延迟检查，确保 callbackObj 不会被地图服务覆盖
    this.setupDelayedCheck(iframeWin, methodNames);
  }

  /**
   * 合并 callbackObj 到 iframe window
   */
  private mergeCallbackObjToIframe(iframeWin: any): void {
    // 如果地图服务已经定义了 callbackObj，合并而不是覆盖
    if (iframeWin.callbackObj) {
      console.log('[MapCallbackHandler] iframe.window.callbackObj 已存在，合并回调');
      Object.keys((window as any).callbackObj).forEach(key => {
        iframeWin.callbackObj[key] = (window as any).callbackObj[key];
      });
    } else {
      // 直接设置 callbackObj
      iframeWin.callbackObj = (window as any).callbackObj;
    }
    
    // 验证设置是否成功
    console.log('[MapCallbackHandler] iframe.window.callbackObj 内容:', Object.keys(iframeWin.callbackObj || {}));
    console.log('[MapCallbackHandler] iframe.window.callbackObj.queryMarkerBack 存在:', typeof iframeWin.callbackObj?.queryMarkerBack);
  }

  /**
   * 设置延迟检查，防止 callbackObj 被覆盖
   */
  private setupDelayedCheck(iframeWin: any, methodNames: string[]): void {
    // 清除之前的定时器
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    console.log('[MapCallbackHandler] 设置延迟检查，将在 2 秒后验证 callbackObj...');
    
    // 延迟检查 callbackObj 是否被覆盖
    this.retryTimer = setTimeout(() => {
      if (this.isDestroyed || !iframeWin) {
        console.log('[MapCallbackHandler] 延迟检查跳过 - handler 已销毁或 iframe 不存在');
        return;
      }
      
      console.log('[MapCallbackHandler] ========== 延迟检查开始 ==========');
      console.log('[MapCallbackHandler] window.callbackObj:', Object.keys((window as any).callbackObj || {}));
      
      if (iframeWin.callbackObj) {
        const currentKeys = Object.keys(iframeWin.callbackObj);
        console.log('[MapCallbackHandler] iframe.window.callbackObj 内容:', currentKeys);
        
        // 检查关键回调是否存在
        const missingCallbacks = methodNames.filter(
          name => typeof iframeWin.callbackObj[name] !== 'function'
        );
        
        if (missingCallbacks.length > 0) {
          console.log('[MapCallbackHandler] ⚠️ 检测到回调丢失:', missingCallbacks);
          missingCallbacks.forEach(methodName => {
            iframeWin.callbackObj[methodName] = (window as any).callbackObj[methodName];
          });
          console.log('[MapCallbackHandler] 重新设置后 - iframe.window.callbackObj 内容:', Object.keys(iframeWin.callbackObj || {}));
        } else {
          console.log('[MapCallbackHandler] ✅ 所有回调都存在');
        }
      } else {
        console.log('[MapCallbackHandler] ⚠️ iframe.window.callbackObj 不存在，重新创建');
        iframeWin.callbackObj = (window as any).callbackObj;
      }
      console.log('[MapCallbackHandler] ========== 延迟检查结束 ==========');
    }, 2000);
  }

  // ========================================
  // 地图初始化
  // ========================================

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

  /**
   * 使用轮询机制初始化地图
   * 注意：此方法不会重复调用 initMapCallbacks，调用前请确保已设置回调
   */
  initializeWithPolling(): void {
    // 不在这里调用 initMapCallbacks，由外部控制
    
    if (!this.iframe?.contentWindow) return;

    const iframeWindow = this.iframe.contentWindow as any;

    // 发送初始化消息
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'map-handler'
    }, '*');

    // 立即尝试调用初始化函数
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      this.isReady = true;
      console.log('[MapCallbackHandler] 地图初始化函数 initView_3d 调用成功');
      return;
    }

    console.warn('[MapCallbackHandler] 地图初始化函数 initView_3d 不存在，开始轮询检查');

    // 轮询检查机制
    const startTime = Date.now();
    const maxWait = MAP_CONFIG.INIT_MAX_WAIT;
    const checkInterval = MAP_CONFIG.INIT_CHECK_INTERVAL;
    
    const checkTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= maxWait) {
        clearInterval(checkTimer);
        console.warn('[MapCallbackHandler] 地图初始化超时，initView_3d 函数不可用');
        return;
      }
      
      const win = this.iframe?.contentWindow as any;
      if (typeof win?.initView_3d === 'function') {
        clearInterval(checkTimer);
        win.initView_3d();
        this.isReady = true;
        console.log('[MapCallbackHandler] 地图初始化成功，耗时:', elapsed, 'ms');
      }
    }, checkInterval);
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
   * 生成随机ID（英文+数字，长度12位）
   */
  private generateRandomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 启用禁飞区拾取模式
   */
  startNoFlyZonePick(): string {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return '';
    }

    const win = this.iframe.contentWindow as any;
    const devType = 8;
    const devId = this.generateRandomId();
    const devName = '';

    if (typeof win.InitDraggableDev_3d === 'function') {
      win.InitDraggableDev_3d();
      console.log('[MapCallbackHandler] InitDraggableDev_3d 调用成功');
    } else {
      console.warn('[MapCallbackHandler] InitDraggableDev_3d 函数不存在');
    }

    if (typeof win.drawDraggableDev_3d === 'function') {
      win.drawDraggableDev_3d(devType, devId, devName);
      console.log('[MapCallbackHandler] drawDraggableDev_3d 调用成功, devId:', devId);
    } else {
      console.warn('[MapCallbackHandler] drawDraggableDev_3d 函数不存在');
    }

    return devId;
  }

  /**
   * 取消禁飞区拾取模式
   */
  cancelNoFlyZonePick(devId: string): void {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return;
    }

    if (!devId) {
      console.warn('[MapCallbackHandler] devId 不能为空');
      return;
    }

    const win = this.iframe.contentWindow as any;

    if (typeof win.removeDraggableDev_3d === 'function') {
      win.removeDraggableDev_3d(devId);
      console.log('[MapCallbackHandler] removeDraggableDev_3d 调用成功, devId:', devId);
    } else {
      console.warn('[MapCallbackHandler] removeDraggableDev_3d 函数不存在');
    }
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
  // 无人机和飞手模型操作
  // ========================================

  /**
   * 添加无人机模型
   */
  addIconMarker_3d(
    uniqueId: string,
    devType: number,
    lng: number,
    lat: number,
    height: number,
    uavType: number,
    uavRegType: number,
    isShowUav: boolean,
    Azim: number,
    iSubType: number,
    hight: number
  ): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.addIconMarker_3d === 'function') {
      win.addIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType, hight);
      console.log('[MapCallbackHandler] addIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] addIconMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 更新无人机模型
   */
  updateIconMarker_3d(
    uniqueId: string,
    devType: number,
    lng: number,
    lat: number,
    height: number,
    uavType: number,
    uavRegType: number,
    isShowUav: boolean,
    Azim: number,
    iSubType: number
  ): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.updateIconMarker_3d === 'function') {
      win.updateIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType);
      console.log('[MapCallbackHandler] updateIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] updateIconMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 添加飞手模型
   */
  addControllerMarker_3d(
    uniqueId: string,
    devType: number,
    lng: number,
    lat: number,
    height: number,
    uavType: number,
    uavRegType: number,
    isShowUav: boolean,
    Azim: number,
    iSubType: number
  ): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.addControllerMarker_3d === 'function') {
      win.addControllerMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType);
      console.log('[MapCallbackHandler] addControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] addControllerMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 更新飞手位置
   */
  updateControllerMarker_3d(
    uniqueId: string,
    lng: number,
    lat: number,
    height: number
  ): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.updateControllerMarker_3d === 'function') {
      win.updateControllerMarker_3d(uniqueId, lng, lat, height);
      console.log('[MapCallbackHandler] updateControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] updateControllerMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 删除飞手模型
   */
  delControllerMarker_3d(uniqueId: string): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.delControllerMarker_3d === 'function') {
      win.delControllerMarker_3d(uniqueId);
      console.log('[MapCallbackHandler] delControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] delControllerMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 删除无人机或飞手模型
   */
  delIconMarker_3d(uniqueId: string): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    if (typeof win.delIconMarker_3d === 'function') {
      win.delIconMarker_3d(uniqueId);
      console.log('[MapCallbackHandler] delIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] delIconMarker_3d 函数不存在');
      return false;
    }
  }

  /**
   * 查询无人机模型
   */
  queryIconMarker_3d(uniqueId: string): boolean {
    if (!this.iframe?.contentWindow) {
      console.warn('[MapCallbackHandler] iframe未初始化');
      return false;
    }

    const win = this.iframe.contentWindow as any;
    
    // 在调用 queryIconMarker_3d 之前，确保 callbackObj 已正确设置
    console.log('[MapCallbackHandler] queryIconMarker_3d 调用前检查 callbackObj');
    console.log('[MapCallbackHandler] window.callbackObj:', Object.keys((window as any).callbackObj || {}));
    console.log('[MapCallbackHandler] iframe.window.callbackObj 存在:', !!win.callbackObj);
    console.log('[MapCallbackHandler] iframe.window.callbackObj.queryMarkerBack 存在:', typeof win.callbackObj?.queryMarkerBack);
    
    // 如果 iframe 内的 callbackObj 不存在或 queryMarkerBack 不存在，重新设置
    if (!win.callbackObj || typeof win.callbackObj.queryMarkerBack !== 'function') {
      console.log('[MapCallbackHandler] ⚠️ callbackObj 未正确设置，重新设置...');
      
      // 确保 window.callbackObj 存在
      if (!(window as any).callbackObj) {
        (window as any).callbackObj = {};
      }
      
      // 重新注册所有回调到 window.callbackObj
      const methodNames = Object.keys(this.callbacks).filter(
        key => typeof this.callbacks[key] === 'function'
      );
      
      methodNames.forEach(methodName => {
        (window as any).callbackObj[methodName] = (...args: any[]) => {
          console.log(`[MapCallbackHandler] 收到地图回调 ${methodName}:`, args);
          if (this.callbacks[methodName]) {
            (this.callbacks[methodName] as Function)(...args);
          }
        };
      });
      
      // 设置到 iframe window
      win.callbackObj = (window as any).callbackObj;
      console.log('[MapCallbackHandler] 重新设置后 - iframe.window.callbackObj 内容:', Object.keys(win.callbackObj || {}));
      console.log('[MapCallbackHandler] 重新设置后 - queryMarkerBack 存在:', typeof win.callbackObj?.queryMarkerBack);
    }
    
    if (typeof win.queryIconMarker_3d === 'function') {
      win.queryIconMarker_3d(uniqueId);
      console.log('[MapCallbackHandler] queryIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[MapCallbackHandler] queryIconMarker_3d 函数不存在');
      return false;
    }
  }

  // ========================================
  // 目标管理（队列机制）
  // ========================================

  /**
   * 添加或更新无人机目标
   * 自动判断是创建还是更新，如果地图未就绪则加入队列
   * @param data 定位目标数据
   * @returns 是否成功处理（加入队列也算成功）
   */
  addOrUpdateUavTarget(data: LocationTargetData): boolean {
    const uniqueId = data.sID;
    
    // 地图未就绪，加入待处理队列
    if (!this.isReady) {
      console.log(`[MapCallbackHandler] 地图未就绪，无人机目标加入队列 - uniqueId: ${uniqueId}`);
      this.pendingUavTargets.push({ data, timestamp: Date.now() });
      return true;
    }
    
    // 检查地图模型是否已创建
    const isCreated = this.createdUavTargets.has(uniqueId);
    
    const lng = Number(data.dbUavLng) || 0;
    const lat = Number(data.dbUavLat) || 0;
    const height = Number(data.dbHeight) || 0;
    
    if (!isCreated) {
      // 创建新模型
      const result = this.addIconMarker_3d(uniqueId, 1, lng, lat, height, 0, 0, true, 0, 0, height);
      if (result) {
        this.createdUavTargets.add(uniqueId);
        console.log(`[MapCallbackHandler] 创建无人机模型成功 - uniqueId: ${uniqueId}`);
      }
      return result;
    } else {
      // 更新已有模型
      const result = this.updateIconMarker_3d(uniqueId, 1, lng, lat, height, 0, 0, true, 0, 0);
      console.log(`[MapCallbackHandler] 更新无人机模型 - uniqueId: ${uniqueId}, 结果: ${result}`);
      return result;
    }
  }

  /**
   * 添加或更新飞手目标
   * @param data 定位目标数据
   * @returns 是否成功处理
   */
  addOrUpdatePilotTarget(data: LocationTargetData): boolean {
    const pilotLng = Number(data.dbPoliteLng) || 0;
    const pilotLat = Number(data.dbPoliteLat) || 0;
    
    // 检查飞手位置是否有效
    if (!pilotLng || !pilotLat || (pilotLng === 0 && pilotLat === 0)) {
      return false;
    }
    
    const pilotUniqueId = `${data.sID}_pilot`;
    
    // 地图未就绪，加入待处理队列
    if (!this.isReady) {
      console.log(`[MapCallbackHandler] 地图未就绪，飞手目标加入队列 - uniqueId: ${pilotUniqueId}`);
      this.pendingPilotTargets.push({ data, timestamp: Date.now() });
      return true;
    }
    
    // 检查地图模型是否已创建
    const isCreated = this.createdPilotTargets.has(pilotUniqueId);
    
    if (!isCreated) {
      // 创建新模型
      const result = this.addControllerMarker_3d(pilotUniqueId, 2, pilotLng, pilotLat, 0, 0, 0, true, 0, 0);
      if (result) {
        this.createdPilotTargets.add(pilotUniqueId);
        console.log(`[MapCallbackHandler] 创建飞手模型成功 - uniqueId: ${pilotUniqueId}`);
      }
      return result;
    } else {
      // 更新已有模型
      const result = this.updateControllerMarker_3d(pilotUniqueId, pilotLng, pilotLat, 0);
      console.log(`[MapCallbackHandler] 更新飞手模型 - uniqueId: ${pilotUniqueId}, 结果: ${result}`);
      return result;
    }
  }

  /**
   * 批量添加目标到待处理队列
   * 用于地图重新加载后重建所有目标
   * @param targets 目标数据列表
   */
  addTargetsToQueue(targets: LocationTargetData[]): void {
    targets.forEach(data => {
      // 添加无人机目标
      this.pendingUavTargets.push({ data, timestamp: Date.now() });
      
      // 如果有飞手位置，也添加飞手目标
      const pilotLng = Number(data.dbPoliteLng) || 0;
      const pilotLat = Number(data.dbPoliteLat) || 0;
      if (pilotLng && pilotLat && (pilotLng !== 0 || pilotLat !== 0)) {
        this.pendingPilotTargets.push({ data, timestamp: Date.now() });
      }
    });
    console.log(`[MapCallbackHandler] 已添加 ${targets.length} 个目标到待处理队列`);
  }

  /**
   * 处理待处理队列
   * 使用异步方式逐个处理，每个目标间隔一定时间
   */
  private async processPendingQueues(): Promise<void> {
    if (!this.isReady) {
      console.log('[MapCallbackHandler] 地图未就绪，跳过队列处理');
      return;
    }
    
    console.log(`[MapCallbackHandler] 开始处理待处理队列 - 无人机: ${this.pendingUavTargets.length}, 飞手: ${this.pendingPilotTargets.length}`);
    
    // 处理无人机队列
    await this.processUavQueue();
    
    // 处理飞手队列
    await this.processPilotQueue();
    
    console.log('[MapCallbackHandler] 待处理队列处理完成');
  }

  /**
   * 处理无人机待处理队列
   */
  private async processUavQueue(): Promise<void> {
    const queue = [...this.pendingUavTargets];
    this.pendingUavTargets = [];
    
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const uniqueId = item.data.sID;
      
      // 使用 Set 判断是否已创建
      const isCreated = this.createdUavTargets.has(uniqueId);
      
      const lng = Number(item.data.dbUavLng) || 0;
      const lat = Number(item.data.dbUavLat) || 0;
      const height = Number(item.data.dbHeight) || 0;
      
      if (!isCreated) {
        this.addIconMarker_3d(uniqueId, 1, lng, lat, height, 0, 0, true, 0, 0, height);
        this.createdUavTargets.add(uniqueId);
        console.log(`[MapCallbackHandler] 队列 - 创建无人机模型 - uniqueId: ${uniqueId}`);
      } else {
        this.updateIconMarker_3d(uniqueId, 1, lng, lat, height, 0, 0, true, 0, 0);
        console.log(`[MapCallbackHandler] 队列 - 更新无人机模型 - uniqueId: ${uniqueId}`);
      }
      
      // 每个目标间隔一定时间
      if (i < queue.length - 1) {
        await this.delay(this.QUEUE_PROCESS_INTERVAL);
      }
    }
  }

  /**
   * 处理飞手待处理队列
   */
  private async processPilotQueue(): Promise<void> {
    const queue = [...this.pendingPilotTargets];
    this.pendingPilotTargets = [];
    
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const pilotLng = Number(item.data.dbPoliteLng) || 0;
      const pilotLat = Number(item.data.dbPoliteLat) || 0;
      
      if (!pilotLng || !pilotLat || (pilotLng === 0 && pilotLat === 0)) {
        continue;
      }
      
      const pilotUniqueId = `${item.data.sID}_pilot`;
      const isCreated = this.createdPilotTargets.has(pilotUniqueId);
      
      if (!isCreated) {
        this.addControllerMarker_3d(pilotUniqueId, 2, pilotLng, pilotLat, 0, 0, 0, true, 0, 0);
        this.createdPilotTargets.add(pilotUniqueId);
        console.log(`[MapCallbackHandler] 队列 - 创建飞手模型 - uniqueId: ${pilotUniqueId}`);
      } else {
        this.updateControllerMarker_3d(pilotUniqueId, pilotLng, pilotLat, 0);
        console.log(`[MapCallbackHandler] 队列 - 更新飞手模型 - uniqueId: ${pilotUniqueId}`);
      }
      
      // 每个目标间隔一定时间
      if (i < queue.length - 1) {
        await this.delay(this.QUEUE_PROCESS_INTERVAL);
      }
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重置所有目标和队列
   * 用于地图重新加载时清空状态
   */
  resetTargets(): void {
    this.createdUavTargets.clear();
    this.createdPilotTargets.clear();
    this.pendingUavTargets = [];
    this.pendingPilotTargets = [];
    console.log('[MapCallbackHandler] 已重置所有目标和队列');
  }

  /**
   * 获取已创建的无人机目标列表
   */
  getCreatedUavTargets(): string[] {
    return Array.from(this.createdUavTargets);
  }

  /**
   * 获取已创建的飞手目标列表
   */
  getCreatedPilotTargets(): string[] {
    return Array.from(this.createdPilotTargets);
  }

  /**
   * 获取待处理队列长度
   */
  getPendingQueueLength(): { uav: number; pilot: number } {
    return {
      uav: this.pendingUavTargets.length,
      pilot: this.pendingPilotTargets.length
    };
  }

  /**
   * 解析鼠标位置字符串
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
    
    // 清除定时器
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
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
  getIsReady(): boolean {
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
