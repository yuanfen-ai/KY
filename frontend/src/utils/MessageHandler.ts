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
  
  // 设备状态上报
  DEVICE_STATUS_REPORT = '04007',
}

// ==================== 数据结构定义 ====================

/**
 * 设备状态上报数据结构
 */
export interface DeviceStatusReportData {
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  sName: string;
  /** 服务在离线状态 1-在线 2-离线 */
  iOnline: 1 | 2;
  /**
   * 设备类型
   * - 5: 无线电侦测
   * - 3: 干扰
   * - 8: 诱骗
   */
  iType: 3 | 5 | 8;
  /** 设备子类型 */
  iSubType: number;
  /** 设备在离线状态 1-在线 2-离线 */
  iLinkState: 1 | 2;
  /** 设备开关状态 1-打开状态 2-关闭状态 */
  blWorkState: 1 | 2;
}

/**
 * 设备状态枚举
 * - online: 在线（iOnline=1 且 iLinkState=1）
 * - offline: 离线（iOnline=2 且 iLinkState=2）
 * - abnormal: 异常（其他情况）
 */
export type DeviceStatusType = 'online' | 'offline' | 'abnormal';

/**
 * 根据设备状态数据计算设备状态类型
 * @param data 设备状态数据
 * @returns 设备状态类型
 */
export function getDeviceStatusType(data: DeviceStatusReportData): DeviceStatusType {
  if (data.iOnline === 1 && data.iLinkState === 1) {
    return 'online';
  } else if (data.iOnline === 2 && data.iLinkState === 2) {
    return 'offline';
  } else {
    return 'abnormal';
  }
}

// ==================== 消息处理器接口 ====================

/** 设备状态处理器 */
interface DeviceStatusHandlers {
  /** 设备状态上报 */
  onDeviceStatusReport?: MessageHandlerFn<DeviceStatusReportData>;
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
    console.log(`[MH-RECV] [${msgId}] MessageCode.DEVICE_STATUS_REPORT="${MessageCode.DEVICE_STATUS_REPORT}" (类型: ${typeof MessageCode.DEVICE_STATUS_REPORT})`);
    console.log(`[MH-RECV] [${msgId}] 比较结果: iCode === MessageCode.DEVICE_STATUS_REPORT =`, iCode === MessageCode.DEVICE_STATUS_REPORT);
    
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

  /** 注册设备状态消息处理器 */
  public setDeviceHandlers(handlers: DeviceStatusHandlers): void {
    console.log(`[MH] setDeviceHandlers 被调用`);
    console.log(`[MH] 注册前 deviceHandlers:`, Object.keys(this.deviceHandlers));
    console.log(`[MH] 要注册的 handlers:`, Object.keys(handlers));
    
    this.deviceHandlers = { ...this.deviceHandlers, ...handlers };
    
    console.log(`[MH] 注册后 deviceHandlers:`, Object.keys(this.deviceHandlers));
    console.log(`[MH] onDeviceStatusReport 是否已注册:`, !!this.deviceHandlers.onDeviceStatusReport);
  }

  /** 批量注册所有处理器 */
  public setAllHandlers(handlers: {
    device?: DeviceStatusHandlers;
  }): void {
    if (handlers.device) this.setDeviceHandlers(handlers.device);
  }

  /** 清空所有处理器 */
  public clearHandlers(): void {
    this.deviceHandlers = {};
  }

  /** 获取处理器注册状态 */
  public getHandlerStatus(): object {
    return {
      device: Object.keys(this.deviceHandlers),
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
