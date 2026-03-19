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

    iframeRef.value.contentWindow.postMessage({
      type: 'INIT_CALLBACK',
      methods: methodNames
    }, '*');

    console.log('[useMap] 已注册回调方法:', methodNames);
  };

  /**
   * 初始化地图（调用 initView_3d）
   */
  const initializeMap = () => {
    if (!iframeRef.value?.contentWindow) return;

    const iframeWindow = iframeRef.value.contentWindow as any;

    // 发送初始化消息
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'vue-app'
    }, '*');

    // 调用初始化函数
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      isMapReady.value = true;
      console.log('[useMap] 地图初始化函数 initView_3d 调用成功');
    } else {
      console.warn('[useMap] 地图初始化函数 initView_3d 不存在');

      // 重试机制
      setTimeout(() => {
        const win = iframeRef.value?.contentWindow as any;
        if (typeof win?.initView_3d === 'function') {
          win.initView_3d();
          isMapReady.value = true;
        }
      }, MAP_CONFIG.INIT_RETRY_DELAY);
    }
  };

  /**
   * 设置回调方法
   */
  const setCallbacks = (newCallbacks: MapCallbacks) => {
    callbacks.value = { ...callbacks.value, ...newCallbacks };
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
    callMapFunction,
    flyTo,
    addMarker,
    removeMarker,
    setCenter,
    
    // 工具方法
    parseLocation
  };
}

export default useMap;
