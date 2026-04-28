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
import type { DeviceStatusReportData, DetectTargetReportData, LocationTargetReportData, DeviceBatteryReportData, DeviceSignalReportData, DevicePositionReportData, DirectionSwitchFeedbackData, InterferenceSwitchFeedbackData, DecoySwitchFeedbackData, DetectTargetLostData, LocationTargetLostData } from '@/models/models';

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

  // ========== 用户管理相关 ==========
  // 新增用户
  USER_ADD = 'DB106',
  // 新增用户响应
  USER_ADD_RESPONSE = 'DB006',
  // 修改用户
  USER_UPDATE = 'DB107',
  // 修改用户响应
  USER_UPDATE_RESPONSE = 'DB007',
  // 删除用户
  USER_DELETE = 'DB108',
  // 删除用户响应
  USER_DELETE_RESPONSE = 'DB008',
  // 查询用户
  USER_QUERY = 'DB109',
  // 查询用户响应
  USER_QUERY_RESPONSE = 'DB009',

  // ========== 禁飞区相关 ==========
  // 新增禁飞区
  NO_FLY_ZONE_ADD = 'DB110',
  // 新增禁飞区响应
  NO_FLY_ZONE_ADD_RESPONSE = 'DB010',
  // 修改禁飞区
  NO_FLY_ZONE_UPDATE = 'DB111',
  // 修改禁飞区响应
  NO_FLY_ZONE_UPDATE_RESPONSE = 'DB011',
  // 删除禁飞区
  NO_FLY_ZONE_DELETE = 'DB112',
  // 删除禁飞区响应
  NO_FLY_ZONE_DELETE_RESPONSE = 'DB012',
  // 查询禁飞区
  NO_FLY_ZONE_QUERY = 'DB113',
  // 查询禁飞区响应
  NO_FLY_ZONE_QUERY_RESPONSE = 'DB013',

  // ========== 系统配置相关 ==========
  // 查询系统配置
  SYSTEM_CONFIG_QUERY = 'DB114',
  // 查询系统配置响应
  SYSTEM_CONFIG_QUERY_RESPONSE = 'DB014',
  // 修改系统配置
  SYSTEM_CONFIG_UPDATE = 'DB115',
  // 修改系统配置响应
  SYSTEM_CONFIG_UPDATE_RESPONSE = 'DB015',

  // ========== 设备信息查询相关 ==========
  // 设备信息查询
  DEVICE_INFO_QUERY = 'DB125',
  // 设备信息查询响应
  DEVICE_INFO_QUERY_RESPONSE = 'DB025',

  // ========== 干扰操作记录相关 ==========
  // 干扰操作记录查询
  INTERFERENCE_RECORD_QUERY = 'DB119',
  // 干扰操作记录查询响应
  INTERFERENCE_RECORD_QUERY_RESPONSE = 'DB019',
  // 干扰操作记录删除
  INTERFERENCE_RECORD_DELETE = 'DB120',
  // 干扰操作记录删除响应
  INTERFERENCE_RECORD_DELETE_RESPONSE = 'DB020',

  // ========== 诱骗操作记录相关 ==========
  // 诱骗操作记录查询
  DECEPTION_RECORD_QUERY = 'DB121',
  // 诱骗操作记录查询响应
  DECEPTION_RECORD_QUERY_RESPONSE = 'DB021',
  // 诱骗操作记录删除
  DECEPTION_RECORD_DELETE = 'DB122',
  // 诱骗操作记录删除响应
  DECEPTION_RECORD_DELETE_RESPONSE = 'DB022',

  // ========== 操作指令相关 ==========
  // 无线电开/关测向
  RADIO_DIRECTION_SWITCH = '05101',
  // 开/关干扰
  INTERFERENCE_SWITCH = '03101',
  // 开/关诱骗
  DECOY_SWITCH = '08101',

  // 设备电量信息反馈
  DEVICE_BATTERY_REPORT = '04001',
  // 设备通信信号反馈
  DEVICE_SIGNAL_REPORT = '04002',

  // 设备位置（经纬度）反馈
  DEVICE_POSITION_REPORT = '04008',

  // 侧向开/关反馈
  DIRECTION_SWITCH_FEEDBACK = '05003',
  // 开/关干扰反馈
  INTERFERENCE_SWITCH_FEEDBACK = '03001',
  // 开/关诱骗反馈
  DECOY_SWITCH_FEEDBACK = '08001',

  // 侦测目标丢失
  DETECT_TARGET_LOST = '05004',
  // 定位目标丢失
  LOCATION_TARGET_LOST = '05005',

  // ========== 通知服务相关 ==========
  ADD_NOFLY_BLACKWHITE_NOTIFY = '00100',
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

/** 用户管理处理器 */
interface UserHandlers {
  /** 新增用户响应 */
  onUserAddResponse?: MessageHandlerFn<any>;
  /** 修改用户响应 */
  onUserUpdateResponse?: MessageHandlerFn<any>;
  /** 删除用户响应 */
  onUserDeleteResponse?: MessageHandlerFn<any>;
  /** 查询用户响应 */
  onUserQueryResponse?: MessageHandlerFn<any>;
}

/** 禁飞区处理器 */
interface NoFlyZoneHandlers {
  /** 新增禁飞区响应 */
  onNoFlyZoneAddResponse?: MessageHandlerFn<any>;
  /** 修改禁飞区响应 */
  onNoFlyZoneUpdateResponse?: MessageHandlerFn<any>;
  /** 删除禁飞区响应 */
  onNoFlyZoneDeleteResponse?: MessageHandlerFn<any>;
  /** 查询禁飞区响应 */
  onNoFlyZoneQueryResponse?: MessageHandlerFn<any>;
}

/** 系统配置处理器 */
interface SystemConfigHandlers {
  /** 查询系统配置响应 */
  onSystemConfigQueryResponse?: MessageHandlerFn<any>;
  /** 修改系统配置响应 */
  onSystemConfigUpdateResponse?: MessageHandlerFn<any>;
}

/** 设备信息处理器 */
interface DeviceInfoHandlers {
  /** 设备信息查询响应 */
  onDeviceInfoQueryResponse?: MessageHandlerFn<any>;
}

/** 干扰操作记录处理器 */
interface InterferenceRecordHandlers {
  /** 干扰操作记录查询响应 */
  onInterferenceRecordQueryResponse?: MessageHandlerFn<any>;
  /** 干扰操作记录删除响应 */
  onInterferenceRecordDeleteResponse?: MessageHandlerFn<any>;
}

/** 诱骗操作记录处理器 */
interface DeceptionRecordHandlers {
  /** 诱骗操作记录查询响应 */
  onDeceptionRecordQueryResponse?: MessageHandlerFn<any>;
  /** 诱骗操作记录删除响应 */
  onDeceptionRecordDeleteResponse?: MessageHandlerFn<any>;
}

/** 设备电量处理器 */
interface DeviceBatteryHandlers {
  /** 设备电量信息反馈 */
  onDeviceBatteryReport?: MessageHandlerFn<DeviceBatteryReportData>;
}

/** 设备信号处理器 */
interface DeviceSignalHandlers {
  /** 设备通信信号反馈 */
  onDeviceSignalReport?: MessageHandlerFn<DeviceSignalReportData>;
}

/** 设备位置处理器 */
interface DevicePositionHandlers {
  /** 设备位置（经纬度）反馈 */
  onDevicePositionReport?: MessageHandlerFn<DevicePositionReportData>;
}

/** 测向开关反馈处理器 */
interface DirectionSwitchHandlers {
  /** 侧向开/关反馈 */
  onDirectionSwitchFeedback?: MessageHandlerFn<DirectionSwitchFeedbackData>;
}

/** 干扰开关反馈处理器 */
interface InterferenceSwitchHandlers {
  /** 开/关干扰反馈 */
  onInterferenceSwitchFeedback?: MessageHandlerFn<InterferenceSwitchFeedbackData>;
}

/** 诱骗开关反馈处理器 */
interface DecoySwitchHandlers {
  /** 开/关诱骗反馈 */
  onDecoySwitchFeedback?: MessageHandlerFn<DecoySwitchFeedbackData>;
}

/** 侦测目标丢失处理器 */
interface DetectTargetLostHandlers {
  /** 侦测目标丢失 */
  onDetectTargetLost?: MessageHandlerFn<DetectTargetLostData>;
}

/** 定位目标丢失处理器 */
interface LocationTargetLostHandlers {
  /** 定位目标丢失 */
  onLocationTargetLost?: MessageHandlerFn<LocationTargetLostData>;
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
  private userHandlers: UserHandlers = {};
  private noFlyZoneHandlers: NoFlyZoneHandlers = {};
  private systemConfigHandlers: SystemConfigHandlers = {};
  private deviceInfoHandlers: DeviceInfoHandlers = {};
  private deviceBatteryHandlers: DeviceBatteryHandlers = {};
  private deviceSignalHandlers: DeviceSignalHandlers = {};
  private devicePositionHandlers: DevicePositionHandlers = {};
  private directionSwitchHandlers: DirectionSwitchHandlers = {};
  private interferenceSwitchHandlers: InterferenceSwitchHandlers = {};
  private decoySwitchHandlers: DecoySwitchHandlers = {};
  private detectTargetLostHandlers: DetectTargetLostHandlers = {};
  private locationTargetLostHandlers: LocationTargetLostHandlers = {};
  private interferenceRecordHandlers: InterferenceRecordHandlers = {};
  private deceptionRecordHandlers: DeceptionRecordHandlers = {};
  
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
    // 注意：不清除处理器注册，避免页面导航后处理器丢失
    
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
    const { iSelfData } = packet;
    // 确保 iCode 为字符串类型且补齐前导零（后端可能传数字如 4008，需转为 "04008"）
    let iCode = String(packet.iCode);
    if (/^\d+$/.test(iCode) && iCode.length < 5) {
      iCode = iCode.padStart(5, '0');
    }
    
    console.log(`[MH-RECV] [${msgId}] 收到消息 iCode="${iCode}" (原始值: ${packet.iCode}, 类型: ${typeof packet.iCode})`);
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

      // ========== 用户管理响应 ==========
      case MessageCode.USER_ADD_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到新增用户响应`);
        this.handleUserAddResponse(iSelfData, packet);
        break;

      case MessageCode.USER_UPDATE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到修改用户响应`);
        this.handleUserUpdateResponse(iSelfData, packet);
        break;

      case MessageCode.USER_DELETE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到删除用户响应`);
        this.handleUserDeleteResponse(iSelfData, packet);
        break;

      case MessageCode.USER_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到查询用户响应`);
        this.handleUserQueryResponse(iSelfData, packet);
        break;

      // ========== 禁飞区响应 ==========
      case MessageCode.NO_FLY_ZONE_ADD_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到新增禁飞区响应`);
        this.handleNoFlyZoneAddResponse(iSelfData, packet);
        break;

      case MessageCode.NO_FLY_ZONE_UPDATE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到修改禁飞区响应`);
        this.handleNoFlyZoneUpdateResponse(iSelfData, packet);
        break;

      case MessageCode.NO_FLY_ZONE_DELETE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到删除禁飞区响应`);
        this.handleNoFlyZoneDeleteResponse(iSelfData, packet);
        break;

      case MessageCode.NO_FLY_ZONE_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到查询禁飞区响应`);
        this.handleNoFlyZoneQueryResponse(iSelfData, packet);
        break;

      // ========== 系统配置响应 ==========
      case MessageCode.SYSTEM_CONFIG_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到查询系统配置响应`);
        this.handleSystemConfigQueryResponse(iSelfData, packet);
        break;

      case MessageCode.SYSTEM_CONFIG_UPDATE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到修改系统配置响应`);
        this.handleSystemConfigUpdateResponse(iSelfData, packet);
        break;

      // ========== 设备信息响应 ==========
      case MessageCode.DEVICE_INFO_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到设备信息查询响应`);
        this.handleDeviceInfoQueryResponse(iSelfData, packet);
        break;

      // ========== 干扰操作记录响应 ==========
      case MessageCode.INTERFERENCE_RECORD_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到干扰操作记录查询响应`);
        this.handleInterferenceRecordQueryResponse(iSelfData, packet);
        break;

      case MessageCode.INTERFERENCE_RECORD_DELETE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到干扰操作记录删除响应`);
        this.handleInterferenceRecordDeleteResponse(iSelfData, packet);
        break;

      // ========== 诱骗操作记录响应 ==========
      case MessageCode.DECEPTION_RECORD_QUERY_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到诱骗操作记录查询响应`);
        this.handleDeceptionRecordQueryResponse(iSelfData, packet);
        break;

      case MessageCode.DECEPTION_RECORD_DELETE_RESPONSE:
        console.log(`[MH-RECV] [${msgId}] 匹配到诱骗操作记录删除响应`);
        this.handleDeceptionRecordDeleteResponse(iSelfData, packet);
        break;

      // ========== 设备电量信息反馈 ==========
      case MessageCode.DEVICE_BATTERY_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到设备电量信息反馈`);
        this.handleDeviceBatteryReport(iSelfData as DeviceBatteryReportData, packet);
        break;

      // ========== 设备通信信号反馈 ==========
      case MessageCode.DEVICE_SIGNAL_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到设备通信信号反馈`);
        this.handleDeviceSignalReport(iSelfData as DeviceSignalReportData, packet);
        break;

      // ========== 设备位置（经纬度）反馈 ==========
      case MessageCode.DEVICE_POSITION_REPORT:
        console.log(`[MH-RECV] [${msgId}] 匹配到设备位置（经纬度）反馈`);
        this.handleDevicePositionReport(iSelfData as DevicePositionReportData, packet);
        break;

      // ========== 侧向开/关反馈 ==========
      case MessageCode.DIRECTION_SWITCH_FEEDBACK:
        console.log(`[MH-RECV] [${msgId}] 匹配到侧向开/关反馈`);
        this.handleDirectionSwitchFeedback(iSelfData as DirectionSwitchFeedbackData, packet);
        break;

      // ========== 开/关干扰反馈 ==========
      case MessageCode.INTERFERENCE_SWITCH_FEEDBACK:
        console.log(`[MH-RECV] [${msgId}] 匹配到开/关干扰反馈`);
        this.handleInterferenceSwitchFeedback(iSelfData as InterferenceSwitchFeedbackData, packet);
        break;

      // ========== 开/关诱骗反馈 ==========
      case MessageCode.DECOY_SWITCH_FEEDBACK:
        console.log(`[MH-RECV] [${msgId}] 匹配到开/关诱骗反馈`);
        this.handleDecoySwitchFeedback(iSelfData as DecoySwitchFeedbackData, packet);
        break;

      case MessageCode.DETECT_TARGET_LOST:
        console.log(`[MH-RECV] [${msgId}] 匹配到侦测目标丢失`);
        this.handleDetectTargetLost(iSelfData as DetectTargetLostData, packet);
        break;

      case MessageCode.LOCATION_TARGET_LOST:
        console.log(`[MH-RECV] [${msgId}] 匹配到定位目标丢失`);
        this.handleLocationTargetLost(iSelfData as LocationTargetLostData, packet);
        break;

      // ========== 未知消息 ==========
      default:
        console.warn(`[MH-RECV] [${msgId}] 未处理的消息类型: iCode="${iCode}" (原始值: ${packet.iCode}, 类型: ${typeof packet.iCode})`);
        // 针对 04008 的额外诊断：即使 default 也检查是否是位置反馈
        if (iCode === '04008' || String(packet.iCode) === '04008' || String(packet.iCode) === '4008') {
          console.warn(`[MH-RECV] [${msgId}] ⚠️ 检测到可能是设备位置反馈(04008)，但未匹配到 case 分支！iCode="${iCode}", DEVICE_POSITION_REPORT="${MessageCode.DEVICE_POSITION_REPORT}"`);
        }
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
      console.debug(`[MH-DISPATCH] 未注册 onDeviceStatusReport 处理器`);
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
      console.debug(`[MH-DISPATCH] 未注册 onDetectTargetReport 处理器`);
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
        console.error(`[MH] [LOCATION_TARGET_REPORT] 原始数据:`, JSON.stringify(data));
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onLocationTargetReport 处理器`);
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
      console.debug(`[MH-DISPATCH] 未注册 onBlackWhiteListAddResponse 处理器`);
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
      console.debug(`[MH-DISPATCH] 未注册 onBlackWhiteListUpdateResponse 处理器`);
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
      console.debug(`[MH-DISPATCH] 未注册 onBlackWhiteListDeleteResponse 处理器`);
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
      console.debug(`[MH-DISPATCH] 未注册 onBlackWhiteListQueryResponse 处理器`);
    }
  }

  // ==================== 用户管理处理方法 ====================

  /**
   * 处理新增用户响应
   */
  private handleUserAddResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 新增用户响应:`, data);
    
    if (this.userHandlers.onUserAddResponse) {
      try {
        this.userHandlers.onUserAddResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [USER_ADD_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onUserAddResponse 处理器`);
    }
  }

  /**
   * 处理修改用户响应
   */
  private handleUserUpdateResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 修改用户响应:`, data);
    
    if (this.userHandlers.onUserUpdateResponse) {
      try {
        this.userHandlers.onUserUpdateResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [USER_UPDATE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onUserUpdateResponse 处理器`);
    }
  }

  /**
   * 处理删除用户响应
   */
  private handleUserDeleteResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 删除用户响应:`, data);
    
    if (this.userHandlers.onUserDeleteResponse) {
      try {
        this.userHandlers.onUserDeleteResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [USER_DELETE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onUserDeleteResponse 处理器`);
    }
  }

  /**
   * 处理查询用户响应
   */
  private handleUserQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 查询用户响应:`, data);
    
    if (this.userHandlers.onUserQueryResponse) {
      try {
        this.userHandlers.onUserQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [USER_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onUserQueryResponse 处理器`);
    }
  }

  // ==================== 禁飞区处理方法 ====================

  /**
   * 处理新增禁飞区响应
   */
  private handleNoFlyZoneAddResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 新增禁飞区响应:`, data);
    
    if (this.noFlyZoneHandlers.onNoFlyZoneAddResponse) {
      try {
        this.noFlyZoneHandlers.onNoFlyZoneAddResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [NO_FLY_ZONE_ADD_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onNoFlyZoneAddResponse 处理器`);
    }
  }

  /**
   * 处理修改禁飞区响应
   */
  private handleNoFlyZoneUpdateResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 修改禁飞区响应:`, data);
    
    if (this.noFlyZoneHandlers.onNoFlyZoneUpdateResponse) {
      try {
        this.noFlyZoneHandlers.onNoFlyZoneUpdateResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [NO_FLY_ZONE_UPDATE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onNoFlyZoneUpdateResponse 处理器`);
    }
  }

  /**
   * 处理删除禁飞区响应
   */
  private handleNoFlyZoneDeleteResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 删除禁飞区响应:`, data);
    
    if (this.noFlyZoneHandlers.onNoFlyZoneDeleteResponse) {
      try {
        this.noFlyZoneHandlers.onNoFlyZoneDeleteResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [NO_FLY_ZONE_DELETE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onNoFlyZoneDeleteResponse 处理器`);
    }
  }

  /**
   * 处理查询禁飞区响应
   */
  private handleNoFlyZoneQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 查询禁飞区响应:`, data);
    
    if (this.noFlyZoneHandlers.onNoFlyZoneQueryResponse) {
      try {
        this.noFlyZoneHandlers.onNoFlyZoneQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [NO_FLY_ZONE_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onNoFlyZoneQueryResponse 处理器`);
    }
  }

  /**
   * 处理查询系统配置响应
   */
  private handleSystemConfigQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 查询系统配置响应:`, data);
    
    if (this.systemConfigHandlers.onSystemConfigQueryResponse) {
      try {
        this.systemConfigHandlers.onSystemConfigQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [SYSTEM_CONFIG_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onSystemConfigQueryResponse 处理器`);
    }
  }

  /**
   * 处理修改系统配置响应
   */
  private handleSystemConfigUpdateResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 修改系统配置响应:`, data);
    
    if (this.systemConfigHandlers.onSystemConfigUpdateResponse) {
      try {
        this.systemConfigHandlers.onSystemConfigUpdateResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [SYSTEM_CONFIG_UPDATE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onSystemConfigUpdateResponse 处理器`);
    }
  }

  /**
   * 处理设备信息查询响应
   */
  private handleDeviceInfoQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 设备信息查询响应:`, data);
    
    if (this.deviceInfoHandlers.onDeviceInfoQueryResponse) {
      try {
        this.deviceInfoHandlers.onDeviceInfoQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [DEVICE_INFO_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDeviceInfoQueryResponse 处理器`);
    }
  }

  // ==================== 干扰操作记录处理方法 ====================

  /**
   * 处理干扰操作记录查询响应
   */
  private handleInterferenceRecordQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 干扰操作记录查询响应:`, data);

    if (this.interferenceRecordHandlers.onInterferenceRecordQueryResponse) {
      try {
        this.interferenceRecordHandlers.onInterferenceRecordQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [INTERFERENCE_RECORD_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onInterferenceRecordQueryResponse 处理器`);
    }
  }

  /**
   * 处理干扰操作记录删除响应
   */
  private handleInterferenceRecordDeleteResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 干扰操作记录删除响应:`, data);

    if (this.interferenceRecordHandlers.onInterferenceRecordDeleteResponse) {
      try {
        this.interferenceRecordHandlers.onInterferenceRecordDeleteResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [INTERFERENCE_RECORD_DELETE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onInterferenceRecordDeleteResponse 处理器`);
    }
  }

  /**
   * 处理诱骗操作记录查询响应
   */
  private handleDeceptionRecordQueryResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 诱骗操作记录查询响应:`, data);

    if (this.deceptionRecordHandlers.onDeceptionRecordQueryResponse) {
      try {
        this.deceptionRecordHandlers.onDeceptionRecordQueryResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [DECEPTION_RECORD_QUERY_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDeceptionRecordQueryResponse 处理器`);
    }
  }

  /**
   * 处理诱骗操作记录删除响应
   */
  private handleDeceptionRecordDeleteResponse(data: any, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 诱骗操作记录删除响应:`, data);

    if (this.deceptionRecordHandlers.onDeceptionRecordDeleteResponse) {
      try {
        this.deceptionRecordHandlers.onDeceptionRecordDeleteResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [DECEPTION_RECORD_DELETE_RESPONSE] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDeceptionRecordDeleteResponse 处理器`);
    }
  }

  /**
   * 处理设备电量信息反馈 (04001)
   */
  private handleDeviceBatteryReport(data: DeviceBatteryReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 设备电量信息: level=${data.iBatteryLevel}, status=${data.iBatteryStatus}`);

    if (this.deviceBatteryHandlers.onDeviceBatteryReport) {
      try {
        this.deviceBatteryHandlers.onDeviceBatteryReport(data, packet);
      } catch (error) {
        console.error(`[MH] [DEVICE_BATTERY_REPORT] 处理器执行失败:`, error);
      }
    }
  }

  /**
   * 处理设备通信信号反馈 (04002)
   */
  private handleDeviceSignalReport(data: DeviceSignalReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 设备通信信号: strength=${data.iSignalStrength}, network=${data.iNetworkType}`);

    if (this.deviceSignalHandlers.onDeviceSignalReport) {
      try {
        this.deviceSignalHandlers.onDeviceSignalReport(data, packet);
      } catch (error) {
        console.error(`[MH] [DEVICE_SIGNAL_REPORT] 处理器执行失败:`, error);
      }
    }
  }

  /**
   * 处理设备位置（经纬度）反馈 (04008)
   */
  private handleDevicePositionReport(data: DevicePositionReportData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 设备位置反馈: dbLng=${data.dbLng}, dbLat=${data.dbLat}`);

    if (this.devicePositionHandlers.onDevicePositionReport) {
      try {
        this.devicePositionHandlers.onDevicePositionReport(data, packet);
      } catch (error) {
        console.error(`[MH] [DEVICE_POSITION_REPORT] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDevicePositionReport 处理器`);
    }
  }

  /**
   * 处理侧向开/关反馈
   */
  private handleDirectionSwitchFeedback(data: DirectionSwitchFeedbackData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 侧向开/关反馈: deviceId=${data.deviceId}, tarid=${data.tarid}, blSwitch=${data.blSwitch}, blState=${data.blState}`);

    if (this.directionSwitchHandlers.onDirectionSwitchFeedback) {
      try {
        this.directionSwitchHandlers.onDirectionSwitchFeedback(data, packet);
      } catch (error) {
        console.error(`[MH] [DIRECTION_SWITCH_FEEDBACK] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDirectionSwitchFeedback 处理器`);
    }
  }

  /**
   * 处理开/关干扰反馈
   */
  private handleInterferenceSwitchFeedback(data: InterferenceSwitchFeedbackData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 开/关干扰反馈: deviceId=${data.deviceId}, blSwitch=${data.blSwitch}, blState=${data.blState}`);

    if (this.interferenceSwitchHandlers.onInterferenceSwitchFeedback) {
      try {
        this.interferenceSwitchHandlers.onInterferenceSwitchFeedback(data, packet);
      } catch (error) {
        console.error(`[MH] [INTERFERENCE_SWITCH_FEEDBACK] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onInterferenceSwitchFeedback 处理器`);
    }
  }

  /**
   * 处理开/关诱骗反馈
   */
  private handleDecoySwitchFeedback(data: DecoySwitchFeedbackData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 开/关诱骗反馈: deviceId=${data.deviceId}, blSwitch=${data.blSwitch}, blState=${data.blState}`);

    if (this.decoySwitchHandlers.onDecoySwitchFeedback) {
      try {
        this.decoySwitchHandlers.onDecoySwitchFeedback(data, packet);
      } catch (error) {
        console.error(`[MH] [DECOY_SWITCH_FEEDBACK] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDecoySwitchFeedback 处理器`);
    }
  }

  private handleDetectTargetLost(data: DetectTargetLostData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 侦测目标丢失: deviceId=${data.deviceId}, iFreq=${data.iFreq}, sTime=${data.sTime}`);

    if (this.detectTargetLostHandlers.onDetectTargetLost) {
      try {
        this.detectTargetLostHandlers.onDetectTargetLost(data, packet);
      } catch (error) {
        console.error(`[MH] [DETECT_TARGET_LOST] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onDetectTargetLost 处理器`);
    }
  }

  private handleLocationTargetLost(data: LocationTargetLostData, packet: WsPacket): void {
    console.log(`[MH-DISPATCH] 定位目标丢失: deviceId=${data.deviceId}, sID=${data.sID}, sTime=${data.sTime}`);

    if (this.locationTargetLostHandlers.onLocationTargetLost) {
      try {
        this.locationTargetLostHandlers.onLocationTargetLost(data, packet);
      } catch (error) {
        console.error(`[MH] [LOCATION_TARGET_LOST] 处理器执行失败:`, error);
      }
    } else {
      console.debug(`[MH-DISPATCH] 未注册 onLocationTargetLost 处理器`);
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
    
    // 使用 createWsPacket 创建标准格式的数据包
    const packet = createWsPacket(iCode, iSelfData);
    
    console.log(`[MH-SEND] [${msgId}] 发送消息 iCode="${iCode}", iType="${packet.iType}"`);
    
    if (!this.wsService) {
      console.error(`[MH-SEND] [${msgId}] WebSocket 服务未初始化`);
      return false;
    }
    
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
    
    console.log(`[MH-SEND] [${msgId}] 发送请求 iCode="${iCode}", iType="${iType || '0'}", 等待响应...`);
    
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

  /**
   * 发送通知消息（无响应）
   * @param iCode 消息码
   * @param iSelfData 数据区
   */
  public sendNotification(iCode: string, iSelfData?: any): boolean {
    const msgId = this.getNextMessageId();
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false });
    
    console.log(`[MH-NOTIFY] [${msgId}] [${timestamp}] 发送通知 iCode="${iCode}" iSelfData=`, iSelfData);
    
    if (!this.wsService) {
      console.error(`[MH-NOTIFY] [${msgId}] WebSocket 服务未初始化`);
      return false;
    }

    // 使用 createWsPacket 创建标准格式的数据包
    const packet = createWsPacket(iCode, iSelfData);
    
    console.log(`[MH-NOTIFY] [${msgId}] 数据包内容:`, JSON.stringify(packet, null, 2));
    
    this.wsService.send(packet);
    
    console.log(`[MH-NOTIFY] [${msgId}] 通知发送完成`);
    
    return true;
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

  /** 注册用户管理消息处理器 */
  public setUserHandlers(handlers: UserHandlers): void {
    console.log(`[MH] setUserHandlers 被调用`);
    this.userHandlers = { ...this.userHandlers, ...handlers };
    console.log(`[MH] 注册后 userHandlers:`, Object.keys(this.userHandlers));
  }

  /** 注册禁飞区消息处理器 */
  public setNoFlyZoneHandlers(handlers: NoFlyZoneHandlers): void {
    console.log(`[MH] setNoFlyZoneHandlers 被调用`);
    this.noFlyZoneHandlers = { ...this.noFlyZoneHandlers, ...handlers };
    console.log(`[MH] 注册后 noFlyZoneHandlers:`, Object.keys(this.noFlyZoneHandlers));
  }

  /** 注册系统配置消息处理器 */
  public setSystemConfigHandlers(handlers: SystemConfigHandlers): void {
    console.log(`[MH] setSystemConfigHandlers 被调用`);
    this.systemConfigHandlers = { ...this.systemConfigHandlers, ...handlers };
    console.log(`[MH] 注册后 systemConfigHandlers:`, Object.keys(this.systemConfigHandlers));
  }

  /** 注册设备信息消息处理器 */
  public setDeviceInfoHandlers(handlers: DeviceInfoHandlers): void {
    console.log(`[MH] setDeviceInfoHandlers 被调用`);
    this.deviceInfoHandlers = { ...this.deviceInfoHandlers, ...handlers };
    console.log(`[MH] 注册后 deviceInfoHandlers:`, Object.keys(this.deviceInfoHandlers));
  }

  public setDeviceBatteryHandlers(handlers: DeviceBatteryHandlers): void {
    console.log(`[MH] setDeviceBatteryHandlers 被调用`);
    this.deviceBatteryHandlers = { ...this.deviceBatteryHandlers, ...handlers };
  }

  public setDeviceSignalHandlers(handlers: DeviceSignalHandlers): void {
    console.log(`[MH] setDeviceSignalHandlers 被调用`);
    this.deviceSignalHandlers = { ...this.deviceSignalHandlers, ...handlers };
  }

  public setDevicePositionHandlers(handlers: DevicePositionHandlers): void {
    console.log(`[MH] setDevicePositionHandlers 被调用`);
    this.devicePositionHandlers = { ...this.devicePositionHandlers, ...handlers };
  }

  public setDirectionSwitchHandlers(handlers: DirectionSwitchHandlers): void {
    console.log(`[MH] setDirectionSwitchHandlers 被调用`);
    this.directionSwitchHandlers = { ...this.directionSwitchHandlers, ...handlers };
  }

  public setInterferenceSwitchHandlers(handlers: InterferenceSwitchHandlers): void {
    console.log(`[MH] setInterferenceSwitchHandlers 被调用`);
    this.interferenceSwitchHandlers = { ...this.interferenceSwitchHandlers, ...handlers };
  }

  public setDecoySwitchHandlers(handlers: DecoySwitchHandlers): void {
    console.log(`[MH] setDecoySwitchHandlers 被调用`);
    this.decoySwitchHandlers = { ...this.decoySwitchHandlers, ...handlers };
  }

  public setDetectTargetLostHandlers(handlers: DetectTargetLostHandlers): void {
    console.log(`[MH] setDetectTargetLostHandlers 被调用`);
    this.detectTargetLostHandlers = { ...this.detectTargetLostHandlers, ...handlers };
  }

  public setLocationTargetLostHandlers(handlers: LocationTargetLostHandlers): void {
    console.log(`[MH] setLocationTargetLostHandlers 被调用`);
    this.locationTargetLostHandlers = { ...this.locationTargetLostHandlers, ...handlers };
  }

  public setInterferenceRecordHandlers(handlers: InterferenceRecordHandlers): void {
    console.log(`[MH] setInterferenceRecordHandlers 被调用`);
    this.interferenceRecordHandlers = { ...this.interferenceRecordHandlers, ...handlers };
  }

  public setDeceptionRecordHandlers(handlers: DeceptionRecordHandlers): void {
    console.log(`[MH] setDeceptionRecordHandlers 被调用`);
    this.deceptionRecordHandlers = { ...this.deceptionRecordHandlers, ...handlers };
  }

  /** 批量注册所有处理器 */
  public setAllHandlers(handlers: {
    device?: DeviceStatusHandlers;
    detectTarget?: DetectTargetHandlers;
    locationTarget?: LocationTargetHandlers;
    blackWhiteList?: BlackWhiteListHandlers;
    user?: UserHandlers;
    noFlyZone?: NoFlyZoneHandlers;
    systemConfig?: SystemConfigHandlers;
    deviceInfo?: DeviceInfoHandlers;
    deviceBattery?: DeviceBatteryHandlers;
    deviceSignal?: DeviceSignalHandlers;
    devicePosition?: DevicePositionHandlers;
    directionSwitch?: DirectionSwitchHandlers;
    interferenceSwitch?: InterferenceSwitchHandlers;
    decoySwitch?: DecoySwitchHandlers;
    detectTargetLost?: DetectTargetLostHandlers;
    locationTargetLost?: LocationTargetLostHandlers;
    interferenceRecord?: InterferenceRecordHandlers;
    deceptionRecord?: DeceptionRecordHandlers;
  }): void {
    if (handlers.device) this.setDeviceHandlers(handlers.device);
    if (handlers.detectTarget) this.setDetectTargetHandlers(handlers.detectTarget);
    if (handlers.locationTarget) this.setLocationTargetHandlers(handlers.locationTarget);
    if (handlers.blackWhiteList) this.setBlackWhiteListHandlers(handlers.blackWhiteList);
    if (handlers.user) this.setUserHandlers(handlers.user);
    if (handlers.noFlyZone) this.setNoFlyZoneHandlers(handlers.noFlyZone);
    if (handlers.systemConfig) this.setSystemConfigHandlers(handlers.systemConfig);
    if (handlers.deviceInfo) this.setDeviceInfoHandlers(handlers.deviceInfo);
    if (handlers.deviceBattery) this.setDeviceBatteryHandlers(handlers.deviceBattery);
    if (handlers.deviceSignal) this.setDeviceSignalHandlers(handlers.deviceSignal);
    if (handlers.devicePosition) this.setDevicePositionHandlers(handlers.devicePosition);
    if (handlers.directionSwitch) this.setDirectionSwitchHandlers(handlers.directionSwitch);
    if (handlers.interferenceSwitch) this.setInterferenceSwitchHandlers(handlers.interferenceSwitch);
    if (handlers.decoySwitch) this.setDecoySwitchHandlers(handlers.decoySwitch);
    if (handlers.detectTargetLost) this.setDetectTargetLostHandlers(handlers.detectTargetLost);
    if (handlers.locationTargetLost) this.setLocationTargetLostHandlers(handlers.locationTargetLost);
    if (handlers.interferenceRecord) this.setInterferenceRecordHandlers(handlers.interferenceRecord);
    if (handlers.deceptionRecord) this.setDeceptionRecordHandlers(handlers.deceptionRecord);
  }

  /** 清空所有处理器 */
  public clearHandlers(): void {
    this.deviceHandlers = {};
    this.detectTargetHandlers = {};
    this.locationTargetHandlers = {};
    this.blackWhiteListHandlers = {};
    this.userHandlers = {};
    this.noFlyZoneHandlers = {};
    this.systemConfigHandlers = {};
    this.deviceInfoHandlers = {};
    this.deviceBatteryHandlers = {};
    this.deviceSignalHandlers = {};
    this.devicePositionHandlers = {};
    this.directionSwitchHandlers = {};
    this.interferenceSwitchHandlers = {};
    this.decoySwitchHandlers = {};
    this.detectTargetLostHandlers = {};
    this.locationTargetLostHandlers = {};
    this.interferenceRecordHandlers = {};
    this.deceptionRecordHandlers = {};
  }

  /** 获取处理器注册状态 */
  public getHandlerStatus(): object {
    return {
      device: Object.keys(this.deviceHandlers),
      detectTarget: Object.keys(this.detectTargetHandlers),
      locationTarget: Object.keys(this.locationTargetHandlers),
      blackWhiteList: Object.keys(this.blackWhiteListHandlers),
      user: Object.keys(this.userHandlers),
      noFlyZone: Object.keys(this.noFlyZoneHandlers),
      systemConfig: Object.keys(this.systemConfigHandlers),
      deviceInfo: Object.keys(this.deviceInfoHandlers),
      deviceBattery: Object.keys(this.deviceBatteryHandlers),
      deviceSignal: Object.keys(this.deviceSignalHandlers),
      devicePosition: Object.keys(this.devicePositionHandlers),
      directionSwitch: Object.keys(this.directionSwitchHandlers),
      interferenceSwitch: Object.keys(this.interferenceSwitchHandlers),
      decoySwitch: Object.keys(this.decoySwitchHandlers),
      detectTargetLost: Object.keys(this.detectTargetLostHandlers),
      locationTargetLost: Object.keys(this.locationTargetLostHandlers),
      interferenceRecord: Object.keys(this.interferenceRecordHandlers),
      deceptionRecord: Object.keys(this.deceptionRecordHandlers),
    };
  }
}

// 单例
export const messageHandler = MessageHandler.getInstance();

// 便捷方法
export const sendMessage = (iCode: string, iSelfData?: any) => messageHandler.send(iCode, iSelfData);
export const sendRequest = (iCode: string, iSelfData?: any, timeout?: number, iType?: string) => 
  messageHandler.sendRequest(iCode, iSelfData, timeout, iType);
export const sendNotification = (iCode: string, iSelfData?: any) => messageHandler.sendNotification(iCode, iSelfData);

// 导出类和枚举
export { MessageHandler };
export { createWsPacket, generateRequestId, getCurrentTimeString };
