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
  // 设备工作范围
  // ========================================

  /** 已创建工作范围的设备ID集合，用于判断新增还是更新 */
  const createdWorkRanges = new Set<string>();

  /**
   * 添加设备工作范围（如果已存在则更新）
   */
  const addOrUpdateWorkRange = (
    node_id: string,
    lng: number,
    lat: number,
    distance: number,
    type: number = 1,
    color: string = "'#ff0000'",
    opacity: number = 0.3,
    height: number = 200
  ): boolean => {
    if (createdWorkRanges.has(node_id)) {
      // 已创建，调用更新接口
      console.log(`[useMap] 更新设备工作范围: node_id=${node_id}, distance=${distance}`);
      return handler?.updateWorkRange_3d(node_id, distance) ?? false;
    } else {
      // 未创建，调用添加接口
      console.log(`[useMap] 添加设备工作范围: node_id=${node_id}, lng=${lng}, lat=${lat}, distance=${distance}, type=${type}, color=${color}, opacity=${opacity}, height=${height}`);
      const result = handler?.workRange_3d(node_id, lng, lat, distance, type, color, opacity, height) ?? false;
      if (result) {
        createdWorkRanges.add(node_id);
        console.log(`[useMap] 设备工作范围已创建, 已记录集合: [${Array.from(createdWorkRanges).join(', ')}]`);
      } else {
        console.warn(`[useMap] 设备工作范围创建失败: node_id=${node_id}`);
      }
      return result;
    }
  };

  /**
   * 删除设备工作范围
   */
  const removeWorkRange = (node_id: string): boolean => {
    console.log(`[useMap] 删除设备工作范围: node_id=${node_id}`);
    const result = handler?.removeWorkRange_3d(node_id) ?? false;
    if (result) {
      createdWorkRanges.delete(node_id);
      console.log(`[useMap] 设备工作范围已删除, 剩余集合: [${Array.from(createdWorkRanges).join(', ')}]`);
    }
    return result;
  };

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
  // 目标管理（封装队列机制）
  // ========================================

  /**
   * 添加或更新无人机目标（自动处理队列）
   */
  const addOrUpdateUavTarget = (data: {
    sID: string;
    dbUavLng?: number;
    dbUavLat?: number;
    dbHeight?: number;
  }): boolean => {
    return handler?.addOrUpdateUavTarget(data) ?? false;
  };

  /**
   * 添加或更新飞手目标（自动处理队列）
   */
  const addOrUpdatePilotTarget = (data: {
    sID: string;
    dbPoliteLng?: number;
    dbPoliteLat?: number;
  }): boolean => {
    return handler?.addOrUpdatePilotTarget(data) ?? false;
  };

  /**
   * 批量添加目标到待处理队列
   */
  const addTargetsToQueue = (targets: Array<{
    sID: string;
    dbUavLng?: number;
    dbUavLat?: number;
    dbHeight?: number;
    dbPoliteLng?: number;
    dbPoliteLat?: number;
  }>): void => {
    handler?.addTargetsToQueue(targets);
  };

  /**
   * 重置所有目标和队列
   */
  const resetTargets = (): void => {
    handler?.resetTargets();
  };

  /**
   * 获取已创建的无人机目标列表
   */
  const getCreatedUavTargets = (): string[] => {
    return handler?.getCreatedUavTargets() ?? [];
  };

  /**
   * 获取已创建的飞手目标列表
   */
  const getCreatedPilotTargets = (): string[] => {
    return handler?.getCreatedPilotTargets() ?? [];
  };

  /**
   * 获取待处理队列长度
   */
  const getPendingQueueLength = (): { uav: number; pilot: number } => {
    return handler?.getPendingQueueLength() ?? { uav: 0, pilot: 0 };
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
    
    // 无人机和飞手模型操作（底层方法）
    addIconMarker_3d,
    updateIconMarker_3d,
    addControllerMarker_3d,
    updateControllerMarker_3d,
    delControllerMarker_3d,
    delIconMarker_3d,
    queryIconMarker_3d,
    
    // 目标管理（推荐使用，自动处理队列）
    addOrUpdateUavTarget,
    addOrUpdatePilotTarget,
    addTargetsToQueue,
    resetTargets,
    getCreatedUavTargets,
    getCreatedPilotTargets,
    getPendingQueueLength,
    
    // 设备工作范围
    addOrUpdateWorkRange,
    removeWorkRange,
    
    // 工具方法
    parseLocation
  };
}

export default useMap;
