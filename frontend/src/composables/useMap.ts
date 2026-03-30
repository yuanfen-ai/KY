/**
 * 地图交互 Composable
 * 提供统一的地图 iframe 交互功能，供所有页面组件使用
 */

import { ref, onUnmounted, type Ref } from 'vue';
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
// 地图 Composable
// ========================================

export function useMap(iframeRef: Ref<HTMLIFrameElement | null>) {
  // 状态
  const isMapReady = ref(false);
  const mapLoadError = ref(false);
  const callbacks = ref<MapCallbacks>({});
  
  // 消息处理器引用
  let messageHandler: ((event: MessageEvent) => void) | null = null;

  // ========================================
  // 辅助函数
  // ========================================

  /**
   * 生成随机ID（英文+数字，长度12位）
   */
  const generateRandomId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // ========================================
  // 核心方法
  // ========================================

  /**
   * 初始化地图
   * 调用时机：iframe onload 事件触发后
   */
  const initMap = () => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return;
    }

    // 注册消息监听
    setupMessageListener();
    
    // 发送回调方法注册
    initMapCallbacks();
    
    // 初始化地图
    initializeMap();
  };

  /**
   * 设置消息监听器
   */
  const setupMessageListener = () => {
    // 移除旧监听器
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
    }

    messageHandler = (event: MessageEvent) => {
      handleMapMessage(event);
    };

    window.addEventListener('message', messageHandler);
  };

  /**
   * 处理来自地图的消息
   */
  const handleMapMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || !data.type) return;

    // 解析回调类型：CALLBACK_xxx -> xxx
    if (data.type.startsWith('CALLBACK_')) {
      const callbackName = data.type.replace('CALLBACK_', '');
      const callback = callbacks.value[callbackName];

      if (typeof callback === 'function') {
        const args = data.args || [];
        callback(...args);
      }
    } else if (data.type === 'MAP_LOADED') {
      console.log('[useMap] 地图页面加载完成');
      callbacks.value.mapLoaded?.();
    } else if (data.type === 'MAP_READY') {
      console.log('[useMap] 地图服务就绪');
      isMapReady.value = true;
    }
  };

  /**
   * 发送回调方法注册到地图
   */
  const initMapCallbacks = () => {
    if (!iframeRef.value?.contentWindow) return;

    const methodNames = Object.keys(callbacks.value).filter(
      key => typeof callbacks.value[key] === 'function'
    );

    // 创建 callbackObj 对象（地图服务需要的回调对象）
    if (!(window as any).callbackObj) {
      (window as any).callbackObj = {};
    }

    // 将回调函数挂载到 window.callbackObj 上，供地图 iframe 调用
    methodNames.forEach(methodName => {
      (window as any).callbackObj[methodName] = (...args: any[]) => {
        console.log(`[useMap] 收到地图回调 ${methodName}:`, args);
        if (callbacks.value[methodName]) {
          (callbacks.value[methodName] as Function)(...args);
        }
      };
      // 同时挂载到 window 上
      (window as any)[methodName] = (window as any).callbackObj[methodName];
    });

    iframeRef.value.contentWindow.postMessage({
      type: 'INIT_CALLBACK',
      methods: methodNames
    }, '*');

    console.log('[useMap] 已注册回调方法到 window.callbackObj:', methodNames);
  };

  /**
   * 初始化地图（调用 initView_3d）
   * 使用轮询检查机制，在函数可用时立即初始化
   */
  const initializeMap = () => {
    if (!iframeRef.value?.contentWindow) return;

    const iframeWindow = iframeRef.value.contentWindow as any;

    // 发送初始化消息
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'vue-app'
    }, '*');

    // 立即尝试调用初始化函数
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      isMapReady.value = true;
      console.log('[useMap] 地图初始化函数 initView_3d 调用成功');
      return;
    }

    console.warn('[useMap] 地图初始化函数 initView_3d 不存在，开始轮询检查');

    // 轮询检查机制 - 更快地检测函数可用性
    const startTime = Date.now();
    const maxWait = MAP_CONFIG.INIT_MAX_WAIT;
    const checkInterval = MAP_CONFIG.INIT_CHECK_INTERVAL;
    
    const checkTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= maxWait) {
        clearInterval(checkTimer);
        console.warn('[useMap] 地图初始化超时，initView_3d 函数不可用');
        return;
      }
      
      const win = iframeRef.value?.contentWindow as any;
      if (typeof win?.initView_3d === 'function') {
        clearInterval(checkTimer);
        win.initView_3d();
        isMapReady.value = true;
        console.log('[useMap] 地图初始化成功，耗时:', elapsed, 'ms');
      }
    }, checkInterval);
  };

  /**
   * 设置回调方法
   */
  const setCallbacks = (newCallbacks: MapCallbacks) => {
    callbacks.value = { ...callbacks.value, ...newCallbacks };
    
    // 创建 callbackObj 对象（地图服务需要的回调对象）
    if (!(window as any).callbackObj) {
      (window as any).callbackObj = {};
    }
    
    // 将回调函数挂载到 window.callbackObj 上，供地图 iframe 调用
    Object.keys(newCallbacks).forEach(methodName => {
      if (typeof newCallbacks[methodName] === 'function') {
        (window as any).callbackObj[methodName] = (...args: any[]) => {
          console.log(`[useMap] 收到地图回调 ${methodName}:`, args);
          if (callbacks.value[methodName]) {
            (callbacks.value[methodName] as Function)(...args);
          }
        };
        // 同时挂载到 window 上
        (window as any)[methodName] = (window as any).callbackObj[methodName];
      }
    });
    
    console.log('[useMap] 已注册回调到 window.callbackObj:', Object.keys(newCallbacks));
  };

  // ========================================
  // 主动触发地图事件
  // ========================================

  /**
   * 发送消息到地图
   */
  const sendToMap = (type: string, payload?: any) => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return;
    }

    iframeRef.value.contentWindow.postMessage({
      type,
      payload,
      source: 'vue-app'
    }, '*');
  };

  /**
   * 启用位置拾取模式
   */
  const startPickLocation = () => {
    sendToMap('START_PICK_LOCATION');
  };

  /**
   * 启用禁飞区位置拾取模式
   * 调用地图的 InitDraggableDev_3d 和 drawDraggableDev_3d
   * @returns 返回生成的 devId
   */
  const startNoFlyZonePick = (): string => {
    if (!iframeRef.value) {
      console.warn('[useMap] iframe ref 不存在');
      return '';
    }
    
    if (!iframeRef.value.contentWindow) {
      console.warn('[useMap] iframe contentWindow 不存在');
      return '';
    }

    const win = iframeRef.value.contentWindow as any;
    const devType = 8;
    const devId = generateRandomId();
    const devName = '';

    // 调用地图初始化可拖拽设备
    if (typeof win.InitDraggableDev_3d === 'function') {
      win.InitDraggableDev_3d();
      console.log('[useMap] InitDraggableDev_3d 调用成功');
    } else {
      console.warn('[useMap] InitDraggableDev_3d 函数不存在');
    }

    // 调用地图绘制可拖拽设备
    if (typeof win.drawDraggableDev_3d === 'function') {
      win.drawDraggableDev_3d(devType, devId, devName);
      console.log('[useMap] drawDraggableDev_3d 调用成功, devId:', devId);
    } else {
      console.warn('[useMap] drawDraggableDev_3d 函数不存在');
    }

    return devId;
  };

  /**
   * 取消禁飞区位置拾取模式
   * 调用地图的 removeDraggableDev_3d
   * @param devId 要移除的设备ID
   */
  const cancelNoFlyZonePick = (devId?: string): void => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return;
    }

    if (!devId) {
      console.warn('[useMap] devId 不能为空');
      return;
    }

    const win = iframeRef.value.contentWindow as any;

    // 调用地图移除可拖拽设备
    if (typeof win.removeDraggableDev_3d === 'function') {
      win.removeDraggableDev_3d(devId);
      console.log('[useMap] removeDraggableDev_3d 调用成功, devId:', devId);
    } else {
      console.warn('[useMap] removeDraggableDev_3d 函数不存在');
    }
  };

  /**
   * 调用地图窗口函数
   */
  const callMapFunction = (functionName: string, ...args: any[]): any => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return null;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win[functionName] === 'function') {
      return win[functionName](...args);
    } else {
      console.warn(`[useMap] 函数 ${functionName} 不存在`);
      return null;
    }
  };

  /**
   * 飞行到指定位置
   */
  const flyTo = (longitude: number, latitude: number, zoom?: number) => {
    sendToMap('FLY_TO', { longitude, latitude, zoom });
  };

  /**
   * 添加标记
   */
  const addMarker = (marker: any) => {
    sendToMap('ADD_MARKER', marker);
  };

  /**
   * 移除标记
   */
  const removeMarker = (markerId: string) => {
    sendToMap('REMOVE_MARKER', { id: markerId });
  };

  /**
   * 设置地图中心点
   */
  const setCenter = (longitude: number, latitude: number) => {
    sendToMap('SET_CENTER', { longitude, latitude });
  };

  // ========================================
  // 无人机和飞手模型操作
  // ========================================

  /**
   * 添加无人机模型
   */
  const addIconMarker_3d = (
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
  ): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.addIconMarker_3d === 'function') {
      win.addIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType, hight);
      console.log('[useMap] addIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] addIconMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 更新无人机模型
   */
  const updateIconMarker_3d = (
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
  ): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.updateIconMarker_3d === 'function') {
      win.updateIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType);
      console.log('[useMap] updateIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] updateIconMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 添加飞手模型
   */
  const addControllerMarker_3d = (
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
  ): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.addControllerMarker_3d === 'function') {
      win.addControllerMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType);
      console.log('[useMap] addControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] addControllerMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 更新飞手位置
   */
  const updateControllerMarker_3d = (
    uniqueId: string,
    lng: number,
    lat: number,
    height: number
  ): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.updateControllerMarker_3d === 'function') {
      win.updateControllerMarker_3d(uniqueId, lng, lat, height);
      console.log('[useMap] updateControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] updateControllerMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 删除飞手模型
   */
  const delControllerMarker_3d = (uniqueId: string): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.delControllerMarker_3d === 'function') {
      win.delControllerMarker_3d(uniqueId);
      console.log('[useMap] delControllerMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] delControllerMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 删除无人机或飞手模型
   */
  const delIconMarker_3d = (uniqueId: string): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.delIconMarker_3d === 'function') {
      win.delIconMarker_3d(uniqueId);
      console.log('[useMap] delIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] delIconMarker_3d 函数不存在');
      return false;
    }
  };

  /**
   * 查询无人机模型
   */
  const queryIconMarker_3d = (uniqueId: string): boolean => {
    if (!iframeRef.value?.contentWindow) {
      console.warn('[useMap] iframe未初始化');
      return false;
    }

    const win = iframeRef.value.contentWindow as any;
    if (typeof win.queryIconMarker_3d === 'function') {
      win.queryIconMarker_3d(uniqueId);
      console.log('[useMap] queryIconMarker_3d 调用成功, uniqueId:', uniqueId);
      return true;
    } else {
      console.warn('[useMap] queryIconMarker_3d 函数不存在');
      return false;
    }
  };

  // ========================================
  // 工具方法
  // ========================================

  /**
   * 解析鼠标位置字符串
   * @param locationStr 格式: "经度 xxx°，纬度 xxx°"
   */
  const parseLocation = (locationStr: string): { longitude: number; latitude: number } | null => {
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
      console.warn('[useMap] 解析坐标失败:', e);
    }
    return null;
  };

  // ========================================
  // 生命周期
  // ========================================

  /**
   * 销毁
   */
  const destroy = () => {
    if (messageHandler) {
      window.removeEventListener('message', messageHandler);
      messageHandler = null;
    }
    callbacks.value = {};
    isMapReady.value = false;
  };

  // 组件卸载时自动销毁
  onUnmounted(() => {
    destroy();
  });

  // ========================================
  // 导出
  // ========================================

  return {
    // 状态
    isMapReady,
    mapLoadError,
    
    // 核心方法
    initMap,
    setCallbacks,
    destroy,
    
    // 主动触发
    sendToMap,
    startPickLocation,
    startNoFlyZonePick,
    cancelNoFlyZonePick,
    callMapFunction,
    flyTo,
    addMarker,
    removeMarker,
    setCenter,
    
    // 无人机和飞手模型操作
    addIconMarker_3d,
    updateIconMarker_3d,
    addControllerMarker_3d,
    updateControllerMarker_3d,
    delControllerMarker_3d,
    delIconMarker_3d,
    queryIconMarker_3d,
    
    // 工具方法
    parseLocation
  };
}

export default useMap;
