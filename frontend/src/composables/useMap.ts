/**
 * 地图交互 Composable（Vue 适配层）
 * 内部使用 MapCallbackHandler，提供 Vue 响应式状态和生命周期管理
 */

import { ref, onUnmounted, type Ref } from 'vue';
import { MapCallbackHandler, type MapCallbacks, type MapLocationData } from '@/utils/MapCallbackHandler';
import { APP_CONFIG } from '@/config';

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
  // 设备工作范围 & 设备模型
  // ========================================

  /** 已创建工作范围的设备ID集合，用于判断新增还是更新 */
  const createdWorkRanges = new Set<string>();

  /** 已创建设备模型的设备ID集合 */
  const createdDevMarkers = new Set<string>();

  /** 当前工作范围对应的设备类型（用于切换时判断是否需要清除重绘） */
  let currentWorkRangeDevType: number | null = null;

  /** 上一次创建工作范围的参数，用于位置更新时复用和经纬度变化判断 */
  let lastWorkRangeParams = {
    lng: 0,
    lat: 0,
    distance: 0,
    region_Type: '10',
    color: '#ff0000',
    opacity: 1,
    border_color: '#ff0000',
    devId: APP_CONFIG.DEFAULT_DEVICE_ID,
    devname: '',
    devType: 0,
    devSubType: 0,
    alt: 0
  };

  /** 缓存的待执行工作范围参数（地图未就绪时暂存完整参数） */
  let pendingWorkRangeParams: {
    lng: number; lat: number; distance: number;
    region_Type: string; color: string; opacity: number; border_color: string;
    devId: string; devname: string; devType: number; devSubType: number; alt: number;
  } | null = null;

  /** 缓存的待执行位置更新参数（04008 先于 DB025 到达时暂存） */
  let pendingPositionUpdate: { lng: number; lat: number } | null = null;

  /**
   * 尝试执行缓存的位置更新（当工作范围参数变为可用时调用）
   */
  const tryPendingPositionUpdate = () => {
    if (pendingPositionUpdate && lastWorkRangeParams.distance > 0) {
      const { lng, lat } = pendingPositionUpdate;
      pendingPositionUpdate = null;
      console.log(`[useMap] 执行缓存的位置更新: lng=${lng}, lat=${lat}`);
      updateWorkRangePosition(lng, lat);
    }
  };

  /**
   * 执行添加/更新工作范围（内部方法）
   * 始终先 removePlolygon_3d 清理历史图形，再 addCircle_3d 绘制新图形
   * addCircle_3d(lng, lat, radius, region_code, region_Type, color, opacity, border_color)
   * 同时调用 addDevMarker_3d 绘制设备模型
   */
  const doAddOrUpdateWorkRange = async (
    lng: number,
    lat: number,
    distance: number,
    region_Type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    border_color: string = '#ff0000',
    _devId: string = '',
    devname: string = '',
    devType: number = 0,
    devSubType: number = 0,
    alt: number = 0
  ): Promise<boolean> => {
    const region_code = APP_CONFIG.DEFAULT_DEVICE_ID;
    const devTypeChanged = currentWorkRangeDevType !== null && currentWorkRangeDevType !== devType;
    // 先检查参数是否未变化（比较新值与旧值，在覆盖前检查）
    // 注意：即使工作范围参数未变，设备模型位置可能需要更新，所以只在两者都未变时才跳过
    if (createdWorkRanges.has(region_code) &&
        lastWorkRangeParams.lng === lng && lastWorkRangeParams.lat === lat && lastWorkRangeParams.distance === distance
        && !devTypeChanged) {
      console.log(`[useMap] 设备工作范围参数未变化且设备类型相同，跳过更新: lng=${lng}, lat=${lat}, devType=${devType}`);
      return true;
    }
    // 缓存参数（即使绘制失败也保存，供 updateWorkRangePosition 使用）
    lastWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color, devId: APP_CONFIG.DEFAULT_DEVICE_ID, devname, devType, devSubType, alt };
    // 先清理历史图形
    console.log(`[useMap] >>> doAddOrUpdateWorkRange 开始: region_code=${region_code}, lng=${lng}, lat=${lat}, distance=${distance}, devType=${devType}, devTypeChanged=${devTypeChanged}, handler=${!!handler}`);
    try { handler?.removePlolygon_3d(); } catch (e) { /* 忽略 */ }
    // 清理 Cesium 中可能残留的同 ID 实体
    handler?.removeEntityById(region_code);
    // 设备模型处理：
    // 1. 如果设备类型变了（菜单切换），先删除旧模型
    // 2. 如果模型已存在且类型未变，删除后重建以确保位置正确
    if (createdDevMarkers.has(region_code)) {
      if (devTypeChanged) {
        console.log(`[useMap] 设备类型变化，删除旧设备模型: devId=${region_code}, oldDevType=${currentWorkRangeDevType}, newDevType=${devType}`);
      } else {
        console.log(`[useMap] 设备模型已存在，先删除再重建以确保位置同步: devId=${region_code}`);
      }
      await handler?.delIconMarker_3d(region_code);
      createdDevMarkers.delete(region_code);
    }
    // 更新设备类型标记
    currentWorkRangeDevType = devType;
    // 清除已创建标记（确保后续可重新创建）
    createdWorkRanges.delete(region_code);
    // 调用 addCircle_3d 绘制新图形
    console.log(`[useMap] >>> 调用 handler.addCircle_3d(lng=${lng}, lat=${lat}, radius=${distance}, region_code=${region_code}, region_Type=${region_Type}, color=${color}, opacity=${opacity}, border_color=${border_color})`);
    try {
      const result = handler?.addCircle_3d(lng, lat, distance, region_code, region_Type, color, opacity, border_color) ?? false;
      console.log(`[useMap] >>> addCircle_3d 返回结果: ${result}`);
      if (result) {
        createdWorkRanges.add(region_code);
        console.log(`[useMap] 设备工作范围绘制成功: region_code=${region_code}`);
      } else {
        console.warn(`[useMap] addCircle_3d 返回 false，300ms 后重试: region_code=${region_code}`);
        setTimeout(() => {
          console.log(`[useMap] >>> 延迟重试 addCircle_3d: region_code=${region_code}`);
          const retryResult = handler?.addCircle_3d(lng, lat, distance, region_code, region_Type, color, opacity, border_color) ?? false;
          console.log(`[useMap] >>> 延迟重试 addCircle_3d 返回结果: ${retryResult}`);
          if (retryResult) {
            createdWorkRanges.add(region_code);
            console.log(`[useMap] 设备工作范围重试绘制成功: region_code=${region_code}`);
          } else {
            console.error(`[useMap] 设备工作范围重试绘制仍失败: region_code=${region_code}`);
            pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color, devId: APP_CONFIG.DEFAULT_DEVICE_ID, devname, devType, devSubType, alt };
          }
        }, 300);
      }
    } catch (e) {
      console.warn(`[useMap] 设备工作范围绘制异常，缓存参数等待重试:`, e);
      pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color, devId: APP_CONFIG.DEFAULT_DEVICE_ID, devname, devType, devSubType, alt };
    }
    // 绘制设备模型 addIconMarker_3d（与 delIconMarker_3d 配对使用）
    // uniqueId 统一使用 APP_CONFIG.DEFAULT_DEVICE_ID
    const deviceId = APP_CONFIG.DEFAULT_DEVICE_ID;
    if (lng && lat) {
      if (!createdDevMarkers.has(deviceId)) {
        // addIconMarker_3d(uniqueId, devType, lng, lat, height, uavType, uavRegType, isShowUav, Azim, iSubType, hight)
        // devType 固定为 10（设备类型标识）
        console.log(`[useMap] >>> 调用 handler.addIconMarker_3d(uniqueId=${deviceId}, devType=10, lng=${lng}, lat=${lat})`);
        try {
          const markerResult = handler?.addIconMarker_3d(deviceId, 10, lng, lat, alt, 0, 0, true, 0, 0, alt) ?? false;
          console.log(`[useMap] >>> addIconMarker_3d 返回结果: ${markerResult}`);
          if (markerResult) {
            createdDevMarkers.add(deviceId);
            console.log(`[useMap] 设备模型绘制成功: uniqueId=${deviceId}`);
          } else {
            console.warn(`[useMap] addIconMarker_3d 返回 false，300ms 后重试: uniqueId=${deviceId}`);
            setTimeout(() => {
              const retryMarkerResult = handler?.addIconMarker_3d(deviceId, 10, lng, lat, alt, 0, 0, true, 0, 0, alt) ?? false;
              console.log(`[useMap] >>> 延迟重试 addIconMarker_3d 返回结果: ${retryMarkerResult}`);
              if (retryMarkerResult) {
                createdDevMarkers.add(deviceId);
              }
            }, 300);
          }
        } catch (e) {
          console.warn(`[useMap] 设备模型绘制异常:`, e);
        }
      } else {
        // 模型已存在缓存中，用 updateDevMarker_3d 更新位置
        console.log(`[useMap] 设备模型已存在缓存中，调用 updateDevMarker_3d 更新位置: uniqueId=${deviceId}, lng=${lng}, lat=${lat}`);
        handler?.updateDevMarker_3d(deviceId, lng, lat, alt);
      }
    } else {
      console.log(`[useMap] 跳过设备模型绘制: lng=${lng}, lat=${lat}`);
    }
    // 绘制后检查是否有缓存的位置更新需要执行
    tryPendingPositionUpdate();
    return true;
  };

  /**
   * 添加设备工作范围圆形 + 设备模型
   * 如果地图未就绪，会缓存操作等 loadComplete 后自动执行
   * 切换菜单时应先调用 clearDeviceGraphics() 清除旧图形
   */
  const addOrUpdateWorkRange = async (
    lng: number,
    lat: number,
    distance: number,
    region_Type: string = '10',
    color: string = '#ff0000',
    opacity: number = 1,
    border_color: string = '#ff0000',
    devId: string = '',
    devname: string = '',
    devType: number = 0,
    devSubType: number = 0,
    alt: number = 0
  ): Promise<boolean> => {
    // 无论地图是否就绪，都先更新 lastWorkRangeParams
    lastWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color, devId: APP_CONFIG.DEFAULT_DEVICE_ID, devname, devType, devSubType, alt };
    console.log(`[useMap] addOrUpdateWorkRange: lng=${lng}, lat=${lat}, distance=${distance}, devId=${devId}, devType=${devType}, isMapReady=${isMapReady.value}`);
    
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存工作范围操作`);
      pendingWorkRangeParams = { lng, lat, distance, region_Type, color, opacity, border_color, devId, devname, devType, devSubType, alt };
      pendingMapOperations.push(async () => {
        if (pendingWorkRangeParams) {
          await doAddOrUpdateWorkRange(
            pendingWorkRangeParams.lng, pendingWorkRangeParams.lat, pendingWorkRangeParams.distance,
            pendingWorkRangeParams.region_Type, pendingWorkRangeParams.color,
            pendingWorkRangeParams.opacity, pendingWorkRangeParams.border_color,
            pendingWorkRangeParams.devId, pendingWorkRangeParams.devname,
            pendingWorkRangeParams.devType, pendingWorkRangeParams.devSubType, pendingWorkRangeParams.alt
          );
          pendingWorkRangeParams = null;
        }
      });
      return true;
    }
    return await doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color, APP_CONFIG.DEFAULT_DEVICE_ID, devname, devType, devSubType, alt);
  };

  /**
   * 清除所有设备图形（工作范围 + 设备模型）
   * 在菜单切换时调用，先清除旧设备的图形，再绘制新设备的图形
   */
  const clearDeviceGraphics = async (): Promise<boolean> => {
    console.log(`[useMap] clearDeviceGraphics: 清除所有设备图形, 工作范围数=${createdWorkRanges.size}, 设备模型数=${createdDevMarkers.size}`);
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，跳过清除`);
      return false;
    }
    // 1. 清除所有工作范围
    try { handler?.removePlolygon_3d(); } catch (e) { /* 忽略 */ }
    createdWorkRanges.forEach(region_code => {
      try { handler?.removeEntityById(region_code); } catch (e) { /* 忽略 */ }
    });
    createdWorkRanges.clear();
    // 2. 清除所有设备模型
    for (const devId of createdDevMarkers) {
      try { await handler?.delIconMarker_3d(devId); } catch (e) { /* 忽略 */ }
    }
    createdDevMarkers.clear();
    // 3. 重置缓存参数
    lastWorkRangeParams = { lng: 0, lat: 0, distance: 0, region_Type: '10', color: '#ff0000', opacity: 1, border_color: '#ff0000', devId: '', devname: '', devType: 0, devSubType: 0, alt: 0 };
    pendingWorkRangeParams = null;
    currentWorkRangeDevType = null;
    console.log(`[useMap] clearDeviceGraphics 完成`);
    return true;
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
   * 更新设备模型位置（仅移动设备模型，不重绘工作范围）
   * 当收到04008设备位置反馈时调用
   */
  const updateDevMarkerPosition = (devId: string, lng: number, lat: number, alt: number = 0): boolean => {
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存设备模型位置更新: devId=${devId}`);
      pendingMapOperations.push(() => {
        handler?.updateDevMarker_3d(devId, lng, lat, alt);
      });
      return true;
    }
    if (!createdDevMarkers.has(devId)) {
      console.warn(`[useMap] 设备模型尚未创建，无法更新位置: devId=${devId}`);
      return false;
    }
    console.log(`[useMap] 更新设备模型位置: devId=${devId}, lng=${lng}, lat=${lat}, alt=${alt}`);
    return handler?.updateDevMarker_3d(devId, lng, lat, alt) ?? false;
  };

  /**
   * 更新设备工作范围位置（先清理历史图形，再重新绘制）
   * 当收到04008设备位置反馈时调用
   * 同时更新设备模型位置
   * 如果工作范围参数尚未就绪（DB025未到达），缓存位置等待参数可用后自动执行
   */
  const updateWorkRangePosition = async (lng: number, lat: number): Promise<boolean> => {
    const region_code = APP_CONFIG.DEFAULT_DEVICE_ID;
    // 优先使用 lastWorkRangeParams，其次使用 pendingWorkRangeParams
    const params = (lastWorkRangeParams.distance !== undefined && lastWorkRangeParams.distance !== 0) 
      ? lastWorkRangeParams 
      : (pendingWorkRangeParams?.distance ? pendingWorkRangeParams : null);
    if (!params?.distance) {
      // 工作范围参数尚未就绪（DB025 还未到达），缓存位置更新
      console.warn(`[useMap] 设备工作范围参数缺失，缓存位置更新等待参数: region_code=${region_code}, lng=${lng}, lat=${lat}, lastWorkRangeParams.distance=${lastWorkRangeParams.distance}`);
      pendingPositionUpdate = { lng, lat };
      return false;
    }
    // 清除缓存的位置更新（因为本次会执行）
    pendingPositionUpdate = null;
    // 经纬度未变化，跳过更新
    if (params.lng === lng && params.lat === lat) {
      console.log(`[useMap] 设备工作范围经纬度未变化，跳过位置更新: lng=${lng}, lat=${lat}`);
      return true;
    }
    const { distance, region_Type, color, opacity, border_color, alt } = params;
    const deviceId = APP_CONFIG.DEFAULT_DEVICE_ID;
    console.log(`[useMap] 更新设备工作范围位置(轻量级): lng=${lng}, lat=${lat}, distance=${distance}, deviceId=${deviceId}`);
    if (!isMapReady.value) {
      console.log(`[useMap] 地图未就绪，缓存位置更新: lng=${lng}, lat=${lat}`);
      pendingMapOperations.push(async () => {
        await updateWorkRangePosition(lng, lat);
      });
      return true;
    }
    // 04008位置更新：不删除，只调用更新位置接口
    // 1. 更新工作范围位置（updateCircle_3d）
    if (createdWorkRanges.has(region_code)) {
      try {
        const circleResult = handler?.updateCircle_3d(lng, lat, distance, region_code, region_Type, color, opacity, border_color) ?? false;
        console.log(`[useMap] updateCircle_3d 返回结果: ${circleResult}, region_code=${region_code}`);
        if (circleResult) {
          // 更新缓存参数
          lastWorkRangeParams.lng = lng;
          lastWorkRangeParams.lat = lat;
        } else {
          // updateCircle_3d 失败，回退到先删后建
          console.warn(`[useMap] updateCircle_3d 返回 false，回退先删后建: region_code=${region_code}`);
          return await doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color, deviceId, params.devname, params.devType, params.devSubType, alt);
        }
      } catch (e) {
        console.warn(`[useMap] updateCircle_3d 异常，回退先删后建:`, e);
        return await doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color, deviceId, params.devname, params.devType, params.devSubType, alt);
      }
    } else {
      // 工作范围不存在，需要先删后建创建
      console.log(`[useMap] 工作范围不存在，走先删后建创建: region_code=${region_code}`);
      return await doAddOrUpdateWorkRange(lng, lat, distance, region_Type, color, opacity, border_color, deviceId, params.devname, params.devType, params.devSubType, alt);
    }
    // 2. 更新设备模型位置（updateDevMarker_3d）
    if (createdDevMarkers.has(deviceId)) {
      console.log(`[useMap] 同步更新设备模型位置: uniqueId=${deviceId}, lng=${lng}, lat=${lat}`);
      updateDevMarkerPosition(deviceId, lng, lat, alt);
    }
    return true;
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

  const setMapReady = async (ready: boolean) => {
    console.log(`[useMap] setMapReady 被调用, ready: ${ready}, 缓存操作数: ${pendingMapOperations.length}, lastWorkRangeParams: lng=${lastWorkRangeParams.lng}, lat=${lastWorkRangeParams.lat}, distance=${lastWorkRangeParams.distance}`);
    isMapReady.value = ready;
    if (ready) {
      // 地图就绪后，依次执行缓存的操作
      const operations = [...pendingMapOperations];
      pendingMapOperations = [];
      console.log(`[useMap] 开始执行 ${operations.length} 个缓存操作`);
      for (let i = 0; i < operations.length; i++) {
        try {
          console.log(`[useMap] 执行缓存操作 #${i + 1}`);
          await operations[i]();
        } catch (e) {
          console.error(`[useMap] 执行缓存操作 #${i + 1} 失败:`, e);
        }
      }
      console.log(`[useMap] 缓存操作全部执行完毕`);
      // 如果有 lastWorkRangeParams 但工作范围未创建（可能 addOrUpdateWorkRange 在地图就绪前被调用过），
      // 且缓存操作中未包含工作范围创建，则手动触发一次
      const regionCode = lastWorkRangeParams.devId || 'HandledGun';
      if (lastWorkRangeParams.distance > 0 && !createdWorkRanges.has(regionCode)) {
        console.log(`[useMap] 检测到有缓存的工作范围参数但未创建，手动触发绘制: lng=${lastWorkRangeParams.lng}, lat=${lastWorkRangeParams.lat}, distance=${lastWorkRangeParams.distance}`);
        await doAddOrUpdateWorkRange(
          lastWorkRangeParams.lng, lastWorkRangeParams.lat, lastWorkRangeParams.distance,
          lastWorkRangeParams.region_Type, lastWorkRangeParams.color,
          lastWorkRangeParams.opacity, lastWorkRangeParams.border_color,
          lastWorkRangeParams.devId, lastWorkRangeParams.devname,
          lastWorkRangeParams.devType, lastWorkRangeParams.devSubType, lastWorkRangeParams.alt
        );
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
    
    // 设备工作范围 & 设备模型
    addOrUpdateWorkRange,
    updateWorkRangePosition,
    updateDevMarkerPosition,
    removeWorkRange,
    clearDeviceGraphics,
    
    // 工具方法
    parseLocation
  };
}

export default useMap;
