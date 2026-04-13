/**
 * WebSocket 消息处理器
 * 统一处理接收消息（心跳除外）和提供统一发送接口
 * 
 * 所有消息均使用 WsPacket 格式：
 * {
 *   iCode: string,  // 消息码
 *   iType: string,  // 消息类型（默认"0"）
 *   iFrom: string,  // 来源标识（默认"0"）
 *   iTo: string,    // 目标标识（默认"0"）
 *   iTime: string,  // 时间戳（格式：yyyy-MM-dd HH:mm:ss）
 *   iSelfData: any  // 数据区
 * }
 * 
 * 日志级别说明：
 * - [MH] - MessageHandler 通用日志
 * - [MH-RECV] - 消息接收日志
 * - [MH-SEND] - 消息发送日志
 * - [MH-DISPATCH] - 消息分发日志
 */

import type { WsPacket } from '@/utils';
import type { DeviceStatusReportData, DetectTargetReportData, LocationTargetReportData } from '@/models/models';

// ==================== 辅助函数 ====================

// 生成请求ID
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取当前时间字符串（格式：yyyy-MM-dd HH:mm:ss）
function getCurrentTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 创建 WsPacket 数据包
function createWsPacket(iCode: string, iSelfData?: any): WsPacket {
  return {
    iCode,
    iType: '0',
    iFrom: '0',
    iTo: generateRequestId(),
    iTime: getCurrentTimeString(),
    iSelfData
  };
}

// ==================== 类型定义 ====================

/** 消息处理器函数类型 */
export type MessageHandlerFn<T = any> = (data: T, packet: WsPacket) => void;

/** 错误响应结构 */
export interface ErrorResponse {
  code: number;
  message: string;
}

/** 消息处理结果 */
export interface HandlerResult {
  success: boolean;
  data?: any;
  error?: ErrorResponse;
}

/** 消息类型枚举 - iCode 值 */
export enum MessageCode {
  // 心跳
  HEARTBEAT_PING = 'ping',
  HEARTBEAT_PONG = 'pong',
  
  // 设备状态上报
  DEVICE_STATUS_REPORT = '04007',
  
  // 侦测目标上报
  DETECT_TARGET_REPORT = '05001',
  
  // 定位目标上报
  LOCATION_TARGET_REPORT = '05002',
  
  // ========== 黑白名单相关 ==========
  // 添加黑白名单
  BLACK_WHITE_LIST_ADD = 'DB102',
  // 添加黑白名单响应
  BLACK_WHITE_LIST_ADD_RESPONSE = 'DB002',
  // 修改黑白名单
  BLACK_WHITE_LIST_UPDATE = 'DB103',
  // 修改黑白名单响应
  BLACK_WHITE_LIST_UPDATE_RESPONSE = 'DB003',
  // 删除黑白名单
  BLACK_WHITE_LIST_DELETE = 'DB104',
  // 删除黑白名单响应
  BLACK_WHITE_LIST_DELETE_RESPONSE = 'DB004',
  // 查询黑白名单
  BLACK_WHITE_LIST_QUERY = 'DB105',
  // 查询黑白名单响应
  BLACK_WHITE_LIST_QUERY_RESPONSE = 'DB005',
}

// ==================== 消息处理器接口 ====================

/** 设备状态处理器 */
interface DeviceStatusHandlers {
  /** 设备状态上报 */
  onDeviceStatusReport?: MessageHandlerFn<DeviceStatusReportData>;
}

/** 侦测目标处理器 */
interface DetectTargetHandlers {
  /** 侦测目标上报 */
  onDetectTargetReport?: MessageHandlerFn<DetectTargetReportData>;
}

/** 定位目标处理器 */
interface LocationTargetHandlers {
  /** 定位目标上报 */
  onLocationTargetReport?: MessageHandlerFn<LocationTargetReportData>;
}

/** 黑白名单处理器 */
interface BlackWhiteListHandlers {
  /** 添加黑白名单响应 */
  onBlackWhiteListAddResponse?: MessageHandlerFn<any>;
  /** 修改黑白名单响应 */
  onBlackWhiteListUpdateResponse?: MessageHandlerFn<any>;
  /** 删除黑白名单响应 */
  onBlackWhiteListDeleteResponse?: MessageHandlerFn<any>;
  /** 查询黑白名单响应 */
  onBlackWhiteListQueryResponse?: MessageHandlerFn<any>;
}

// ==================== 消息处理器类 ====================

/**
 * 消息处理器
 * 使用 switch 结构管理消息类型，支持扩展
 */
class MessageHandler {
  private static instance: MessageHandler;
  private wsService: any = null;
  private isInitialized: boolean = false;
  private messageId: number = 0;
  
  // 处理器回调
  private deviceHandlers: DeviceStatusHandlers = {};
  private detectTargetHandlers: DetectTargetHandlers = {};
  private locationTargetHandlers: LocationTargetHandlers = {};
  private blackWhiteListHandlers: BlackWhiteListHandlers = {};
  
  // 响应等待队列
  private pendingRequests: Map<string, {
    resolve: (result: HandlerResult) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = new Map();

  private constructor() {
    console.log(`[MH] MessageHandler 单例已创建 (WsPacket 格式适配)`);
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  /**
   * 初始化，绑定 WebSocket 服务
   * @param wsService WebSocket 服务实例
   */
  public init(wsService: any): void {
    console.log(`[MH] 初始化 MessageHandler...`);
    
    if (this.isInitialized) {
      console.warn(`[MH] MessageHandler 已经初始化，无需重复初始化`);
      return;
    }
    
    this.wsService = wsService;
    this.isInitialized = true;
    
    // 监听消息事件（心跳 pong 已由 WebSocketService 处理）
    wsService.on('message', (packet: WsPacket) => {
      this.dispatchMessage(packet);
    });
    
    console.log(`[MH] MessageHandler 初始化完成`);
  }

  /**
   * 销毁，解除绑定
   */
  public destroy(): void {
    console.log(`[MH] 销毁 MessageHandler...`);
    
    if (this.wsService) {
      this.wsService.off('message');
    }
    
    // 清除所有等待的请求
    this.pendingRequests.forEach(({ timer }) => clearTimeout(timer));
    this.pendingRequests.clear();
    
    this.wsService = null;
    this.isInitialized = false;
    this.clearHandlers();
    
    console.log(`[MH] MessageHandler 已销毁`);
  }

  /**
   * 获取下一个消息ID（用于追踪）
   */
  private getNextMessageId(): string {
    this.messageId++;
    return `msg_${this.messageId}`;
  }

  // ==================== 消息分发 ====================

  /**
   * 消息分发中心
   */
  private dispatchMessage(packet: WsPacket): void {
    const msgId = this.getNextMessageId();
    const { iCode, iSelfData } = packet;
    
    console.log(`[MH-RECV] [${msgId}] 收到消息 iCode="${iCode}" (类型: ${typeof iCode})`);
    console.log(`[MH-RECV] [${msgId}] MessageCode 枚举值:`, {
      DEVICE_STATUS_REPORT: MessageCode.DEVICE_STATUS_REPORT,
      DETECT_TARGET_REPORT: MessageCode.DETECT_TARGET_REPORT,
      LOCATION_TARGET_REPORT: MessageCode.LOCATION_TARGET_REPORT
    });
    
    // 检查是否是等待中的请求响应
    const pendingKey = iCode;
    if (this.pendingRequests.has(pendingKey)) {
      const pending = this.pendingRequests.get(pendingKey)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(pendingKey);
      
      const result: HandlerResult = {
        success: true,
        data: iSelfData
      };
      pending.resolve(result);
      return;
    }
    
    // 使用 switch 结构分发消息
    switch (iCode) {
      // ========== 心跳消息（通常由 WebSocketService 处理）==========
      case MessageCode.HEARTBEAT_PONG:
        console.log(`[MH-RECV] [${msgId}] 心跳响应 (pong)`);
        break;

      // ========== 设备状态上报 ==========
      case MessageCode.DEVICE_STATUS_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到设备状态上报消息`);
        this.handleDeviceStatusReport(iSelfData as DeviceStatusReportData, packet);
        break;

      // ========== 侦测目标上报 ==========
      case MessageCode.DETECT_TARGET_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到侦测目标上报消息`);
        this.handleDetectTargetReport(iSelfData as DetectTargetReportData, packet);
        break;

      // ========== 定位目标上报 ==========
      case MessageCode.LOCATION_TARGET_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到定位目标上报消息`);
        this.handleLocationTargetReport(iSelfData as LocationTargetReportData, packet);
        break;

      // ========== 黑白名单响应 ==========
      case MessageCode.BLACK_WHITE_LIST_ADD_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到添加黑白名单响应`);
        this.handleBlackWhiteListAddResponse(iSelfData, packet);
        break;

      case MessageCode.BLACK_WHITE_LIST_UPDATE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到修改黑白名单响应`);
        this.handleBlackWhiteListUpdateResponse(iSelfData, packet);
        break;

      case MessageCode.BLACK_WHITE_LIST_DELETE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到删除黑白名单响应`);
        this.handleBlackWhiteListDeleteResponse(iSelfData, packet);
        break;

      case MessageCode.BLACK_WHITE_LIST_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到查询黑白名单响应`);
        this.handleBlackWhiteListQueryResponse(iSelfData, packet);
        break;

      // ========== 未知消息 ==========
      default:
        console.warn(`[MH-RECV] [${msgId}] 未处理的消息类型: ${iCode}`);
        this.handleUnknownMessage(iCode, iSelfData, packet);
        break;
    }
  }

  // ==================== 消息处理器实现 ====================

  /**
   * 处理设备状态上报
   */
  private handleDeviceStatusReport(data: DeviceStatusReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 设备状态上报:`, {
      deviceId: data.deviceId,
      sName: data.sName,
      iOnline: data.iOnline === 1 ? '在线' : '离线',
      iType: data.iType,
      iSubType: data.iSubType,
      iLinkState: data.iLinkState === 1 ? '在线' : '离线',
      blWorkState: data.blWorkState === 1 ? '打开' : '关闭'
    });
    
    console.log(`[MH-DISPATCH] 当前注册的处理器:`, Object.keys(this.deviceHandlers));
    console.log(`[MH-DISPATCH] onDeviceStatusReport 处理器是否存在:`, !!this.deviceHandlers.onDeviceStatusReport);
    
    if (this.deviceHandlers.onDeviceStatusReport) {
      try {
        console.log(`[MH-DISPATCH] 正在调用 onDeviceStatusReport 处理器...`);
        this.deviceHandlers.onDeviceStatusReport(data, packet);
        console.log(`[MH-DISPATCH] onDeviceStatusReport 处理器调用完成`);
      } catch (error) {
        console.error(`[MH] [DEVICE_STATUS_REPORT] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onDeviceStatusReport 处理器`);
    }
  }

  /**
   * 处理侦测目标上报
   */
  private handleDetectTargetReport(data: DetectTargetReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 侦测目标上报:`, {
      deviceId: data.deviceId,
      tarid: data.tarid,
      iFreq: data.iFreq,
      iSignalLevel: data.iSignalLevel,
      sTime: data.sTime
    });
    
    if (this.detectTargetHandlers.onDetectTargetReport) {
      try {
        this.detectTargetHandlers.onDetectTargetReport(data, packet);
      } catch (error) {
        console.error(`[MH] [DETECT_TARGET_REPORT] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onDetectTargetReport 处理器`);
    }
  }

  /**
   * 处理定位目标上报
   */
  private handleLocationTargetReport(data: LocationTargetReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 定位目标上报:`, {
      deviceId: data.deviceId,
      sID: data.sID,
      sAirType: data.sAirType,
      dbUavLng: data.dbUavLng,
      dbUavLat: data.dbUavLat,
      dbAlt: data.dbAlt,
      dbHeight: data.dbHeight,
      iSpeedH: data.iSpeedH,
      iSpeedV: data.iSpeedV,
      iFreq: data.iFreq,
      sTime: data.sTime
    });
    
    if (this.locationTargetHandlers.onLocationTargetReport) {
      try {
        this.locationTargetHandlers.onLocationTargetReport(data, packet);
      } catch (error) {
        console.error(`[MH] [LOCATION_TARGET_REPORT] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onLocationTargetReport 处理器`);
    }
  }

  /**
   * 处理添加黑白名单响应
   */
  private handleBlackWhiteListAddResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 添加黑白名单响应:`, data);
    
    if (this.blackWhiteListHandlers.onBlackWhiteListAddResponse) {
      try {
        this.blackWhiteListHandlers.onBlackWhiteListAddResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [BLACK_WHITE_LIST_ADD_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onBlackWhiteListAddResponse 处理器`);
    }
  }

  /**
   * 处理修改黑白名单响应
   */
  private handleBlackWhiteListUpdateResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 修改黑白名单响应:`, data);
    
    if (this.blackWhiteListHandlers.onBlackWhiteListUpdateResponse) {
      try {
        this.blackWhiteListHandlers.onBlackWhiteListUpdateResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [BLACK_WHITE_LIST_UPDATE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onBlackWhiteListUpdateResponse 处理器`);
    }
  }

  /**
   * 处理删除黑白名单响应
   */
  private handleBlackWhiteListDeleteResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 删除黑白名单响应:`, data);
    
    if (this.blackWhiteListHandlers.onBlackWhiteListDeleteResponse) {
      try {
        this.blackWhiteListHandlers.onBlackWhiteListDeleteResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [BLACK_WHITE_LIST_DELETE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onBlackWhiteListDeleteResponse 处理器`);
    }
  }

  /**
   * 处理查询黑白名单响应
   */
  private handleBlackWhiteListQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 查询黑白名单响应:`, data);
    
    if (this.blackWhiteListHandlers.onBlackWhiteListQueryResponse) {
      try {
        this.blackWhiteListHandlers.onBlackWhiteListQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [BLACK_WHITE_LIST_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.warn(`[MH-DISPATCH] 未注册 onBlackWhiteListQueryResponse 处理器`);
    }
  }

  /**
   * 处理未知消息
   */
  private handleUnknownMessage(iCode: string, data: any, _packet: WsPacket): void {
    console.log(`[MH] [Unknown] iCode="${iCode}", data:`, data);
  }

  // ==================== 发送接口 ====================

  /**
   * 统一发送消息（使用 WsPacket 格式）
   * @param iCode 消息码
   * @param iSelfData 数据区
   * @param iType 数据包类型（如 "db" 用于黑白名单等数据库操作）
   */
  public send(iCode: string, iSelfData?: any, iType?: string): boolean {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] [${msgId}] 发送消息 iCode="${iCode}", iType="${iType || 'unknown'}"`);
    
    if (!this.wsService) {
      console.error(`[MH-SEND] [${msgId}] WebSocket 服务未初始化`);
      return false;
    }

    // 使用 createWsPacket 创建标准格式的数据包
    const packet = createWsPacket(iCode, iSelfData);
    
    // 如果指定了 iType，则覆盖
    if (iType) {
      packet.iType = iType;
    }
    
    this.wsService.send(packet);
    
    return true;
  }

  /**
   * 发送请求并等待响应
   * @param iCode 消息码
   * @param iSelfData 数据区
   * @param timeout 超时时间（毫秒）
   * @param iType 数据包类型（如 "db" 用于黑白名单等数据库操作）
   */
  public sendRequest(iCode: string, iSelfData?: any, timeout: number = 30000, iType?: string): Promise<HandlerResult> {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] [${msgId}] 发送请求 iCode="${iCode}", iType="${iType || 'unknown'}", 等待响应...`);
    
    return new Promise((resolve) => {
      if (!this.send(iCode, iSelfData, iType)) {
        resolve({ success: false, error: { code: -1, message: '发送失败' } });
        return;
      }

      // 设置超时定时器
      const timer = setTimeout(() => {
        this.pendingRequests.delete(iCode);
        console.warn(`[MH-SEND] [${msgId}] 请求超时`);
        resolve({ success: false, error: { code: -2, message: '请求超时' } });
      }, timeout);

      // 添加到等待队列
      this.pendingRequests.set(iCode, { resolve, timer });
    });
  }

  // ==================== 处理器注册 ====================

  /** 注册设备状态消息处理器 */
  public setDeviceHandlers(handlers: DeviceStatusHandlers): void {
    console.log(`[MH] setDeviceHandlers 被调用`);
    console.log(`[MH] 注册前 deviceHandlers:`, Object.keys(this.deviceHandlers));
    console.log(`[MH] 要注册的 handlers:`, Object.keys(handlers));
    
    this.deviceHandlers = { ...this.deviceHandlers, ...handlers };
    
    console.log(`[MH] 注册后 deviceHandlers:`, Object.keys(this.deviceHandlers));
    console.log(`[MH] onDeviceStatusReport 是否已注册:`, !!this.deviceHandlers.onDeviceStatusReport);
  }

  /** 注册侦测目标消息处理器 */
  public setDetectTargetHandlers(handlers: DetectTargetHandlers): void {
    console.log(`[MH] setDetectTargetHandlers 被调用`);
    this.detectTargetHandlers = { ...this.detectTargetHandlers, ...handlers };
    console.log(`[MH] 注册后 detectTargetHandlers:`, Object.keys(this.detectTargetHandlers));
  }

  /** 注册定位目标消息处理器 */
  public setLocationTargetHandlers(handlers: LocationTargetHandlers): void {
    console.log(`[MH] setLocationTargetHandlers 被调用`);
    this.locationTargetHandlers = { ...this.locationTargetHandlers, ...handlers };
    console.log(`[MH] 注册后 locationTargetHandlers:`, Object.keys(this.locationTargetHandlers));
  }

  /** 注册黑白名单消息处理器 */
  public setBlackWhiteListHandlers(handlers: BlackWhiteListHandlers): void {
    console.log(`[MH] setBlackWhiteListHandlers 被调用`);
    this.blackWhiteListHandlers = { ...this.blackWhiteListHandlers, ...handlers };
    console.log(`[MH] 注册后 blackWhiteListHandlers:`, Object.keys(this.blackWhiteListHandlers));
  }

  /** 批量注册所有处理器 */
  public setAllHandlers(handlers: {
    device?: DeviceStatusHandlers;
    detectTarget?: DetectTargetHandlers;
    locationTarget?: LocationTargetHandlers;
    blackWhiteList?: BlackWhiteListHandlers;
  }): void {
    if (handlers.device) this.setDeviceHandlers(handlers.device);
    if (handlers.detectTarget) this.setDetectTargetHandlers(handlers.detectTarget);
    if (handlers.locationTarget) this.setLocationTargetHandlers(handlers.locationTarget);
    if (handlers.blackWhiteList) this.setBlackWhiteListHandlers(handlers.blackWhiteList);
  }

  /** 清空所有处理器 */
  public clearHandlers(): void {
    this.deviceHandlers = {};
    this.detectTargetHandlers = {};
    this.locationTargetHandlers = {};
    this.blackWhiteListHandlers = {};
  }

  /** 获取处理器注册状态 */
  public getHandlerStatus(): object {
    return {
      device: Object.keys(this.deviceHandlers),
      detectTarget: Object.keys(this.detectTargetHandlers),
      locationTarget: Object.keys(this.locationTargetHandlers),
      blackWhiteList: Object.keys(this.blackWhiteListHandlers),
    };
  }
}

// ==================== 导出 ====================

// 单例
export const messageHandler = MessageHandler.getInstance();

// 便捷方法
export const sendMessage = (iCode: string, iSelfData?: any) => messageHandler.send(iCode, iSelfData);
export const sendRequest = (iCode: string, iSelfData?: any, timeout?: number, iType?: string) => 
  messageHandler.sendRequest(iCode, iSelfData, timeout, iType);

// 导出类和枚举
export { MessageHandler };
export { createWsPacket, generateRequestId, getCurrentTimeString };
