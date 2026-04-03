/**
 * 地图交互 Composable（Vue 适配层）
 * 内部使用 MapCallbackHandler，提供 Vue 响应式状态和生命周期管理
 */

import { ref, onUnmounted, type Ref } from 'vue';
import { MapCallbackHandler, type MapCallbacks, type MapLocationData } from '@/utils/MapCallbackHandler';

// 重新导出类型，保持 API 兼容
export type { MapCallbacks, MapLocationData };

// ========================================
// 地图 Composable
// ========================================

export function useMap(iframeRef: Ref<HTMLIFrameElement | null>) {
  // ========================================
  // 状态（Vue 响应式）
  // ========================================
  
  const isMapReady = ref(false);
  const mapLoadError = ref(false);
  
  // 核心处理器实例
  let handler: MapCallbackHandler | null = null;
  
  // 待设置的回调（在 initMap 之前设置的回调）
  let pendingCallbacks: MapCallbacks = {};

  // ========================================
  // 核心方法
  // ========================================

  /**
   * 初始化地图
   * 调用时机：iframe onload 事件触发后
   */
  const initMap = () => {
    if (!iframeRef.value) {
      console.warn('[useMap] iframe ref 不存在');
      return;
    }

    // 创建处理器实例
    handler = new MapCallbackHandler();
    handler.init(iframeRef.value);
    
    // 设置之前缓存的回调
    if (Object.keys(pendingCallbacks).length > 0) {
      console.log('[useMap] 设置缓存的回调:', Object.keys(pendingCallbacks));
      handler.setCallbacks(pendingCallbacks);
      pendingCallbacks = {}; // 清空缓存
    }
    
    // 初始化回调注册
    handler.initMapCallbacks();
    
    // 初始化地图（带轮询机制）
    handler.initializeWithPolling();
  };
  
  /**
   * 设置地图就绪状态（供外部调用）
   * 当 loadComplete 回调触发时，由 Main.vue 调用此方法
   */
  const setMapReady = (ready: boolean) => {
    console.log('[useMap] setMapReady 被调用, ready:', ready);
    isMapReady.value = ready;
  };

  /**
   * 设置回调方法
   */
  const setCallbacks = (newCallbacks: MapCallbacks) => {
    console.log('[useMap] setCallbacks 被调用, handler 存在:', !!handler, '回调:', Object.keys(newCallbacks));
    if (handler) {
      handler.setCallbacks(newCallbacks);
      // 重新初始化 callbackObj 以确保新回调被注册
      handler.initMapCallbacks();
    } else {
      // handler 未初始化，缓存回调
      console.log('[useMap] 缓存回调，等待 initMap:', Object.keys(newCallbacks));
      pendingCallbacks = { ...pendingCallbacks, ...newCallbacks };
    }
  };

  /**
   * 销毁
   */
  const destroy = () => {
    if (handler) {
      handler.destroy();
      handler = null;
    }
    pendingCallbacks = {};
    isMapReady.value = false;
    mapLoadError.value = false;
  };

  // ========================================
  // 主动触发地图事件（代理到 handler）
  // ========================================

  const sendToMap = (type: string, payload?: any) => {
    handler?.sendToMap(type, payload);
  };

  const startPickLocation = () => {
    handler?.startPickLocation();
  };

  const startNoFlyZonePick = (): string => {
    return handler?.startNoFlyZonePick() || '';
  };

  const cancelNoFlyZonePick = (devId?: string) => {
    if (devId) {
      handler?.cancelNoFlyZonePick(devId);
    }
  };

  const callMapFunction = (functionName: string, ...args: any[]): any => {
    return handler?.callMapFunction(functionName, ...args);
  };

  const flyTo = (longitude: number, latitude: number, zoom?: number) => {
    handler?.flyTo(longitude, latitude, zoom);
  };

  const addMarker = (marker: any) => {
    handler?.addMarker(marker);
  };

  const removeMarker = (markerId: string) => {
    handler?.removeMarker(markerId);
  };

  const setCenter = (longitude: number, latitude: number) => {
    handler?.setCenter(longitude, latitude);
  };

  // ========================================
  // 无人机和飞手模型操作（代理到 handler）
  // ========================================

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
    return handler?.addIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType, hight) ?? false;
  };

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
    return handler?.updateIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType) ?? false;
  };

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
    return handler?.addControllerMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType) ?? false;
  };

  const updateControllerMarker_3d = (
    uniqueId: string,
    lng: number,
    lat: number,
    height: number
  ): boolean => {
    return handler?.updateControllerMarker_3d(uniqueId, lng, lat, height) ?? false;
  };

  const delControllerMarker_3d = (uniqueId: string): boolean => {
    return handler?.delControllerMarker_3d(uniqueId) ?? false;
  };

  const delIconMarker_3d = (uniqueId: string): boolean => {
    return handler?.delIconMarker_3d(uniqueId) ?? false;
  };

  const queryIconMarker_3d = (uniqueId: string): boolean => {
    return handler?.queryIconMarker_3d(uniqueId) ?? false;
  };

  // ========================================
  // 工具方法
  // ========================================

  const parseLocation = (locationStr: string): { longitude: number; latitude: number } | null => {
    return MapCallbackHandler.parseLocation(locationStr);
  };

  // ========================================
  // 生命周期
  // ========================================

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
    setMapReady,
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
