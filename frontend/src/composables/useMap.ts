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
  // 地图是否就绪（loadComplete 回调触发后为 true）
  const isMapReady = ref(false);
  // 地图未就绪时缓存的操作
  let pendingMapOperations: (() => void | Promise<void>)[] = [];
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
    region_Type: '10',
    color: '#ff0000',
    opacity: 1,
    border_color: '#ff0000'
  };

  /** 缓存的待执行工作范围参数（地图未就绪或绘制失败时暂存） */
  let pendingWorkRangeParams: {
    lng: number; lat: number; distance: number;
    region_Type: string; color: string; opacity: number; border_color: string;
  } | null = null;

  /**
   * 执行添加/更新工作范围（内部方法）
   * 始终先 removePlolygon_3d 清理历史图形，再 addCircle_3d 绘制新图形
   * addCircle_3d(lng, lat, radius, region_code, region_Type, color, opacity, border_color)
   */
  const doAddOrUpdateWorkRange = (
    lng: number,
    lat: number,
    distance: number,
    region_Type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    border_color: string = '#ff0000'
  ): boolean => {
    const region_code = 'HandledGun';
    // 参数未变化则跳过
    if (createdWorkRanges.has(region_code) &&
        lastWorkRangeParams.lng === lng && lastWorkRangeParams.lat === lat && lastWorkRangeParams.distance === distance) {
      console.log(`[useMap] 设备工作范围参数未变化，跳过更新: lng=${lng}, lat=${lat}`);
      return true;
    }
    // 先清理历史图形
    console.log(`[useMap] 先清理历史工作范围，再重新绘制: region_code=${region_code}`);
    try { handler?.removePlolygon_3d(); } catch (e) { /* 忽略 */ }
    // 清理 Cesium 中可能残留的同 ID 实体
    handler?.removeEntityById(region_code);
    // 清除已创建标记（确保后续可重新创建）
    createdWorkRanges.delete(region_code);
    // 直接绘制新图形
    try {
      const result = handler?.addCircle_3d(lng, lat, distance, region_code, region_Type, color, opacity, border_color) ?? false;
      if (result) {
        createdWorkRanges.add(region_code);
        lastWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color };
        console.log(`[useMap] 设备工作范围绘制成功: region_code=${region_code}, lng=${lng}, lat=${lat}, distance=${distance}`);
      } else {
        console.warn(`[useMap] 设备工作范围绘制失败，缓存参数等待重试: region_code=${region_code}`);
        pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color };
      }
    } catch (e) {
      console.warn(`[useMap] 设备工作范围绘制异常，缓存参数等待重试:`, e);
      pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color };
    }
    return true;
  };

  /**
   * 添加设备工作范围圆形
   * 如果地图未就绪，会缓存操作等 loadComplete 后自动执行
   */
  const addOrUpdateWorkRange = (
    lng: number,
    lat: number,
    distance: number,
    region_Type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    border_color: string = '#ff0000'
  ): boolean => {
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存工作范围操作: lng=${lng}, lat=${lat}`);
      pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color };
      pendingMapOperations.push(() => {
        if (pendingWorkRangeParams) {
          doAddOrUpdateWorkRange(
            pendingWorkRangeParams.lng, pendingWorkRangeParams.lat, pendingWorkRangeParams.distance,
            pendingWorkRangeParams.region_Type, pendingWorkRangeParams.color,
            pendingWorkRangeParams.opacity, pendingWorkRangeParams.border_color
          );
          pendingWorkRangeParams = null;
        }
      });
      return true;
    }
    return doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color);
  };

  /**
   * 删除设备工作范围
   */
  const removeWorkRange = (node_id: string): boolean => {
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存删除工作范围操作: node_id=${node_id}`);
      pendingMapOperations.push(() => {
        handler?.removeWorkRange_3d(node_id);
      });
      return true;
    }
    console.log(`[useMap] 删除设备工作范围: node_id=${node_id}`);
    const result = handler?.removeWorkRange_3d(node_id) ?? false;
    if (result) {
      console.log(`[useMap] 设备工作范围已删除`);
    }
    return result;
  };

  /**
   * 更新设备工作范围位置（先清理历史图形，再重新绘制）
   * 当收到04008设备位置反馈时调用
   * 如果地图未就绪，会缓存操作等 loadComplete 后自动执行
   */
  const updateWorkRangePosition = (lng: number, lat: number): boolean => {
    const region_code = 'HandledGun';
    if (!lastWorkRangeParams.distance) {
      console.warn(`[useMap] 设备工作范围参数缺失，无法更新位置: region_code=${region_code}`);
      return false;
    }
    // 经纬度未变化，跳过更新
    if (lastWorkRangeParams.lng === lng && lastWorkRangeParams.lat === lat) {
      console.log(`[useMap] 设备工作范围经纬度未变化，跳过位置更新: lng=${lng}, lat=${lat}`);
      return true;
    }
    const { distance, region_Type, color, opacity, border_color } = lastWorkRangeParams;
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存工作范围位置更新: lng=${lng}, lat=${lat}`);
      pendingMapOperations.push(() => {
        doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color);
      });
      return true;
    }
    return doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color);
  };

  let handler: MapCallbackHandler | null = null;
  let mapLoadError: string | null = null;
  let pendingCallbacks: Partial<MapCallbacks> = {};

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
    if (ready) {
      // 地图就绪后，依次执行缓存的操作
      const operations = [...pendingMapOperations];
      pendingMapOperations = [];
      for (const op of operations) {
        try {
          op();
        } catch (e) {
          console.error('[useMap] 执行缓存操作失败:', e);
        }
      }
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
    mapLoadError = null;
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
