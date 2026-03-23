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

import type { WsPacket } from '@/types';
import { createWsPacket } from '@/types';

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
  
  // 无人机相关
  UAV_TARGET_REPORT = 'stUAVTargetReport',           // 无人机目标信息上报
  UAV_TARGET_UPDATE = 'stUAVTargetUpdate',           // 无人机目标更新
  UAV_FLIGHT_PATH = 'stUAVFlightPath',               // 无人机飞行轨迹
  
  // 设备控制相关
  DEVICE_STATUS = 'stDeviceStatus',                  // 设备状态
  CONTROL_COMMAND = 'stControlCommand',              // 控制命令
  COMMAND_RESPONSE = 'stCommandResponse',            // 命令响应
  
  // 任务相关
  TASK_ASSIGN = 'stTaskAssign',                      // 任务分配
  TASK_RESULT = 'stTaskResult',                      // 任务结果
  TASK_PROGRESS = 'stTaskProgress',                  // 任务进度
  
  // 系统相关
  SYSTEM_CONFIG = 'stSystemConfig',                  // 系统配置
  ALARM_INFO = 'stAlarmInfo',                        // 告警信息
}

// ==================== 消息处理器接口 ====================

/** 无人机目标处理器 */
interface UAVTargetHandlers {
  /** 目标信息上报 */
  onTargetReport?: MessageHandlerFn<UAVTargetReportData>;
  /** 目标位置更新 */
  onTargetUpdate?: MessageHandlerFn<UAVTargetUpdateData>;
  /** 飞行轨迹 */
  onFlightPath?: MessageHandlerFn<UAVFlightPathData>;
}

/** 设备控制处理器 */
interface DeviceControlHandlers {
  /** 设备状态变化 */
  onDeviceStatus?: MessageHandlerFn<DeviceStatusData>;
  /** 控制命令响应 */
  onCommandResponse?: MessageHandlerFn<CommandResponseData>;
}

/** 任务处理器 */
interface TaskHandlers {
  /** 任务分配 */
  onTaskAssign?: MessageHandlerFn<TaskAssignData>;
  /** 任务结果 */
  onTaskResult?: MessageHandlerFn<TaskResultData>;
  /** 任务进度 */
  onTaskProgress?: MessageHandlerFn<TaskProgressData>;
}

/** 系统处理器 */
interface SystemHandlers {
  /** 系统配置更新 */
  onSystemConfig?: MessageHandlerFn<SystemConfigData>;
  /** 告警信息 */
  onAlarmInfo?: MessageHandlerFn<AlarmInfoData>;
}

// ==================== 数据结构定义 ====================

export interface UAVTargetReportData {
  targetId: string;
  targetType: string;
  position: { lat: number; lng: number; alt: number };
  velocity: { speed: number; direction: number };
  timestamp: number;
}

export interface UAVTargetUpdateData {
  targetId: string;
  position: { lat: number; lng: number; alt: number };
  timestamp: number;
}

export interface UAVFlightPathData {
  targetId: string;
  points: Array<{ lat: number; lng: number; alt: number; timestamp: number }>;
}

export interface DeviceStatusData {
  deviceId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  battery?: number;
  mode?: string;
}

export interface CommandResponseData {
  commandId: string;
  code: number;
  message: string;
  result?: any;
}

export interface TaskAssignData {
  taskId: string;
  taskType: string;
  targetId: string;
  priority: number;
  params?: any;
}

export interface TaskResultData {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface TaskProgressData {
  taskId: string;
  progress: number;
  stage?: string;
}

export interface SystemConfigData {
  configType: string;
  config: any;
  timestamp: number;
}

export interface AlarmInfoData {
  alarmId: string;
  alarmType: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
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
  private uavHandlers: UAVTargetHandlers = {};
  private deviceHandlers: DeviceControlHandlers = {};
  private taskHandlers: TaskHandlers = {};
  private systemHandlers: SystemHandlers = {};
  
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
    
    console.log(`[MH-RECV] [${msgId}] 收到消息 iCode="${iCode}"`);
    
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
      // ========== 无人机相关 ==========
      case MessageCode.UAV_TARGET_REPORT:
        this.handleUAVTargetReport(iSelfData, packet);
        break;
        
      case MessageCode.UAV_TARGET_UPDATE:
        this.handleUAVTargetUpdate(iSelfData, packet);
        break;
        
      case MessageCode.UAV_FLIGHT_PATH:
        this.handleUAVFlightPath(iSelfData, packet);
        break;

      // ========== 设备控制相关 ==========
      case MessageCode.DEVICE_STATUS:
        this.handleDeviceStatus(iSelfData, packet);
        break;
        
      case MessageCode.COMMAND_RESPONSE:
        this.handleCommandResponse(iSelfData, packet);
        break;

      // ========== 任务相关 ==========
      case MessageCode.TASK_ASSIGN:
        this.handleTaskAssign(iSelfData, packet);
        break;
        
      case MessageCode.TASK_RESULT:
        this.handleTaskResult(iSelfData, packet);
        break;
        
      case MessageCode.TASK_PROGRESS:
        this.handleTaskProgress(iSelfData, packet);
        break;

      // ========== 系统相关 ==========
      case MessageCode.SYSTEM_CONFIG:
        this.handleSystemConfig(iSelfData, packet);
        break;
        
      case MessageCode.ALARM_INFO:
        this.handleAlarmInfo(iSelfData, packet);
        break;

      // ========== 心跳消息（通常由 WebSocketService 处理）==========
      case MessageCode.HEARTBEAT_PONG:
        console.log(`[MH-RECV] [${msgId}] 心跳响应 (pong)`);
        break;

      // ========== 未知消息 ==========
      default:
        console.warn(`[MH-RECV] [${msgId}] 未处理的消息类型: ${iCode}`);
        this.handleUnknownMessage(iCode, iSelfData, packet);
        break;
    }
  }

  // ==================== 消息处理器实现 ====================

  private handleUAVTargetReport(data: UAVTargetReportData, packet: WsPacket): void {
    if (this.uavHandlers.onTargetReport) {
      try {
        this.uavHandlers.onTargetReport(data, packet);
      } catch (error) {
        console.error(`[MH] [UAV_TARGET_REPORT] 处理器执行失败:`, error);
      }
    }
  }

  private handleUAVTargetUpdate(data: UAVTargetUpdateData, packet: WsPacket): void {
    if (this.uavHandlers.onTargetUpdate) {
      try {
        this.uavHandlers.onTargetUpdate(data, packet);
      } catch (error) {
        console.error(`[MH] [UAV_TARGET_UPDATE] 处理器执行失败:`, error);
      }
    }
  }

  private handleUAVFlightPath(data: UAVFlightPathData, packet: WsPacket): void {
    if (this.uavHandlers.onFlightPath) {
      try {
        this.uavHandlers.onFlightPath(data, packet);
      } catch (error) {
        console.error(`[MH] [UAV_FLIGHT_PATH] 处理器执行失败:`, error);
      }
    }
  }

  private handleDeviceStatus(data: DeviceStatusData, packet: WsPacket): void {
    if (this.deviceHandlers.onDeviceStatus) {
      try {
        this.deviceHandlers.onDeviceStatus(data, packet);
      } catch (error) {
        console.error(`[MH] [DEVICE_STATUS] 处理器执行失败:`, error);
      }
    }
  }

  private handleCommandResponse(data: CommandResponseData, packet: WsPacket): void {
    if (this.deviceHandlers.onCommandResponse) {
      try {
        this.deviceHandlers.onCommandResponse(data, packet);
      } catch (error) {
        console.error(`[MH] [COMMAND_RESPONSE] 处理器执行失败:`, error);
      }
    }
  }

  private handleTaskAssign(data: TaskAssignData, packet: WsPacket): void {
    if (this.taskHandlers.onTaskAssign) {
      try {
        this.taskHandlers.onTaskAssign(data, packet);
      } catch (error) {
        console.error(`[MH] [TASK_ASSIGN] 处理器执行失败:`, error);
      }
    }
  }

  private handleTaskResult(data: TaskResultData, packet: WsPacket): void {
    if (this.taskHandlers.onTaskResult) {
      try {
        this.taskHandlers.onTaskResult(data, packet);
      } catch (error) {
        console.error(`[MH] [TASK_RESULT] 处理器执行失败:`, error);
      }
    }
  }

  private handleTaskProgress(data: TaskProgressData, packet: WsPacket): void {
    if (this.taskHandlers.onTaskProgress) {
      try {
        this.taskHandlers.onTaskProgress(data, packet);
      } catch (error) {
        console.error(`[MH] [TASK_PROGRESS] 处理器执行失败:`, error);
      }
    }
  }

  private handleSystemConfig(data: SystemConfigData, packet: WsPacket): void {
    if (this.systemHandlers.onSystemConfig) {
      try {
        this.systemHandlers.onSystemConfig(data, packet);
      } catch (error) {
        console.error(`[MH] [SYSTEM_CONFIG] 处理器执行失败:`, error);
      }
    }
  }

  private handleAlarmInfo(data: AlarmInfoData, packet: WsPacket): void {
    if (this.systemHandlers.onAlarmInfo) {
      try {
        this.systemHandlers.onAlarmInfo(data, packet);
      } catch (error) {
        console.error(`[MH] [ALARM_INFO] 处理器执行失败:`, error);
      }
    }
  }

  private handleUnknownMessage(iCode: string, data: any, _packet: WsPacket): void {
    console.log(`[MH] [Unknown] iCode="${iCode}", data:`, data);
  }

  // ==================== 发送接口 ====================

  /**
   * 统一发送消息（使用 WsPacket 格式）
   * @param iCode 消息码
   * @param iSelfData 数据区
   */
  public send(iCode: string, iSelfData?: any): boolean {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] [${msgId}] 发送消息 iCode="${iCode}"`);
    
    if (!this.wsService) {
      console.error(`[MH-SEND] [${msgId}] WebSocket 服务未初始化`);
      return false;
    }

    // 使用 createWsPacket 创建标准格式的数据包
    const packet = createWsPacket(iCode, iSelfData);
    
    this.wsService.send(packet);
    
    return true;
  }

  /**
   * 发送请求并等待响应
   * @param iCode 消息码
   * @param iSelfData 数据区
   * @param timeout 超时时间（毫秒）
   */
  public sendRequest(iCode: string, iSelfData?: any, timeout: number = 30000): Promise<HandlerResult> {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] [${msgId}] 发送请求 iCode="${iCode}", 等待响应...`);
    
    return new Promise((resolve) => {
      if (!this.send(iCode, iSelfData)) {
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

  /** 注册无人机消息处理器 */
  public setUAVHandlers(handlers: UAVTargetHandlers): void {
    this.uavHandlers = { ...this.uavHandlers, ...handlers };
  }

  /** 注册设备控制消息处理器 */
  public setDeviceHandlers(handlers: DeviceControlHandlers): void {
    this.deviceHandlers = { ...this.deviceHandlers, ...handlers };
  }

  /** 注册任务消息处理器 */
  public setTaskHandlers(handlers: TaskHandlers): void {
    this.taskHandlers = { ...this.taskHandlers, ...handlers };
  }

  /** 注册系统消息处理器 */
  public setSystemHandlers(handlers: SystemHandlers): void {
    this.systemHandlers = { ...this.systemHandlers, ...handlers };
  }

  /** 批量注册所有处理器 */
  public setAllHandlers(handlers: {
    uav?: UAVTargetHandlers;
    device?: DeviceControlHandlers;
    task?: TaskHandlers;
    system?: SystemHandlers;
  }): void {
    if (handlers.uav) this.setUAVHandlers(handlers.uav);
    if (handlers.device) this.setDeviceHandlers(handlers.device);
    if (handlers.task) this.setTaskHandlers(handlers.task);
    if (handlers.system) this.setSystemHandlers(handlers.system);
  }

  /** 清空所有处理器 */
  public clearHandlers(): void {
    this.uavHandlers = {};
    this.deviceHandlers = {};
    this.taskHandlers = {};
    this.systemHandlers = {};
  }

  /** 获取处理器注册状态 */
  public getHandlerStatus(): object {
    return {
      uav: Object.keys(this.uavHandlers),
      device: Object.keys(this.deviceHandlers),
      task: Object.keys(this.taskHandlers),
      system: Object.keys(this.systemHandlers),
    };
  }
}

// ==================== 导出 ====================

// 单例
export const messageHandler = MessageHandler.getInstance();

// 便捷方法
export const sendMessage = (iCode: string, iSelfData?: any) => messageHandler.send(iCode, iSelfData);
export const sendRequest = (iCode: string, iSelfData?: any, timeout?: number) => 
  messageHandler.sendRequest(iCode, iSelfData, timeout);

// 导出类和枚举
export { MessageHandler };
