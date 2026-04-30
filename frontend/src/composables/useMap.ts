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

  /** 上一次创建工作范围的参数，用于位置更新时复用和经纬度变化判断 */
  let lastWorkRangeParams = {
    lng: 0,
    lat: 0,
    distance: 0,
    type: '10',
    color: '#ff0000',
    opacity: 1,
    height: 0
  };

  /** 缓存的待执行工作范围参数（地图未就绪时暂存） */
  let pendingWorkRangeParams: {
    lng: number; lat: number; distance: number;
    type: string; color: string; opacity: number; height: number;
  } | null = null;

  /**
   * 执行添加/更新工作范围（内部方法）
   * 统一采用"先删后建"策略，避免 Cesium 中残留实体导致重复添加
   */
  const doAddOrUpdateWorkRange = (
    lng: number,
    lat: number,
    distance: number,
    type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    height: number = 0
  ): boolean => {
    const node_id = 'HandledGun';
    // 判断经纬度是否有变化
    if (createdWorkRanges.has(node_id) && lastWorkRangeParams.lng === lng && lastWorkRangeParams.lat === lat) {
      console.log(`[useMap] 设备工作范围经纬度未变化，跳过更新: lng=${lng}, lat=${lat}`);
      return true;
    }
    // 统一：先删除再创建，避免 Cesium 中残留实体
    console.log(`[useMap] 重建设备工作范围: node_id=${node_id}, lng=${lng}, lat=${lat}, distance=${distance}`);
    handler?.removeWorkRange_3d(node_id);

    const rangeResult = handler?.workRange_3d(node_id, lng, lat, distance, type, color, opacity, height) ?? false;
    if (rangeResult) {
      createdWorkRanges.add(node_id);
      lastWorkRangeParams = { lng, lat, distance, type, color, opacity, height };
      handler?.addDevMarker_3d(node_id, "", 10, 0, lng, lat, 0, distance);
      console.log(`[useMap] 设备工作范围已创建`);
    } else {
      console.warn(`[useMap] 设备工作范围创建失败: node_id=${node_id}`);
    }
    return rangeResult;
  };

  /**
   * 添加设备工作范围圆形（如果已存在则先删除再重新添加）
   * 如果地图未就绪，会缓存参数等 loadComplete 后重试
   */
  const addOrUpdateWorkRange = (
    lng: number,
    lat: number,
    distance: number,
    type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    height: number = 0
  ): boolean => {
    const result = doAddOrUpdateWorkRange(lng, lat, distance, type, color, opacity, height);
    if (!result) {
      // 地图函数未就绪，缓存参数等 loadComplete 后重试
      console.log(`[useMap] 工作范围创建失败，缓存参数等待地图就绪后重试: lng=${lng}, lat=${lat}`);
      pendingWorkRangeParams = { lng, lat, distance, type, color, opacity, height };
    } else {
      pendingWorkRangeParams = null;
    }
    return result;
  };

  /**
   * 删除设备工作范围
   */
  const removeWorkRange = (node_id: string): boolean => {
    console.log(`[useMap] 删除设备工作范围: node_id=${node_id}`);
    const result = handler?.removeWorkRange_3d(node_id) ?? false;
    if (result) {
      console.log(`[useMap] 设备工作范围已删除`);
    }
    return result;
  };

  /**
   * 更新设备工作范围位置（仅更新经纬度，复用上一次的样式参数）
   * 当收到04008设备位置反馈时调用
   */
  const updateWorkRangePosition = (lng: number, lat: number): boolean => {
    const node_id = 'HandledGun';
    if (!createdWorkRanges.has(node_id)) {
      console.warn(`[useMap] 设备工作范围尚未创建，无法更新位置: node_id=${node_id}`);
      return false;
    }
    // 经纬度未变化，跳过更新
    if (lastWorkRangeParams.lng === lng && lastWorkRangeParams.lat === lat) {
      console.log(`[useMap] 设备工作范围经纬度未变化，跳过位置更新: lng=${lng}, lat=${lat}`);
      return true;
    }
    const { distance, type, color, opacity, height } = lastWorkRangeParams;
    console.log(`[useMap] 更新设备工作范围位置: node_id=${node_id}, lng: ${lastWorkRangeParams.lng}->${lng}, lat: ${lastWorkRangeParams.lat}->${lat}`);
    // 先删除再重新添加
    handler?.removePlolygon_3d();
    handler?.delDevMarker_3d(node_id);
    handler?.workRange_3d(node_id, lng, lat, distance, type, color, opacity, height);
    handler?.addDevMarker_3d(node_id, "", 10, 0, lng, lat, 0, distance);
    lastWorkRangeParams = { lng, lat, distance, type, color, opacity, height };
    return true;
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
    // 地图就绪后，重试缓存的工作范围参数
    if (ready && pendingWorkRangeParams) {
      console.log('[useMap] 地图就绪，重试缓存的工作范围参数:', pendingWorkRangeParams);
      const p = pendingWorkRangeParams;
      pendingWorkRangeParams = null;
      doAddOrUpdateWorkRange(p.lng, p.lat, p.distance, p.type, p.color, p.opacity, p.height);
    }
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

  const delControllerMarker_3d = async (uniqueId: string): Promise<boolean> => {
    return await handler?.delControllerMarker_3d(uniqueId) ?? false;
  };

  const delIconMarker_3d = async (uniqueId: string): Promise<boolean> => {
    return await handler?.delIconMarker_3d(uniqueId) ?? false;
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
  const addOrUpdateUavTarget = async (data: {
    sID: string;
    dbUavLng?: number;
    dbUavLat?: number;
    dbHeight?: number;
  }): Promise<boolean> => {
    return await handler?.addOrUpdateUavTarget(data) ?? false;
  };

  /**
   * 添加或更新飞手目标（自动处理队列）
   */
  const addOrUpdatePilotTarget = async (data: {
    sID: string;
    dbPoliteLng?: number;
    dbPoliteLat?: number;
  }): Promise<boolean> => {
    return await handler?.addOrUpdatePilotTarget(data) ?? false;
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
    updateWorkRangePosition,
    removeWorkRange,
    
    // 工具方法
    parseLocation
  };
}

export default useMap;
