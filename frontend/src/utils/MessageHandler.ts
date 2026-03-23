/**
 * WebSocket 消息处理器
 * 统一处理接收消息（心跳除外）和提供统一发送接口
 * 
 * 使用 switch 结构管理消息类型，方便扩展
 * 
 * 日志级别说明：
 * - [MH] - MessageHandler 通用日志
 * - [MH-RECV] - 消息接收日志
 * - [MH-SEND] - 消息发送日志
 * - [MH-DISPATCH] - 消息分发日志
 */

// ==================== 类型定义 ====================

/** 消息处理器函数类型 */
export type MessageHandlerFn<T = any> = (data: T) => void;

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

/** 消息类型枚举 */
export enum MessageType {
  // 无人机相关
  UAV_TARGET_REPORT = 'stUAVTargetReport',           // 无人机目标信息上报
  UAV_TARGET_UPDATE = 'stUAVTargetUpdate',         // 无人机目标更新
  UAV_FLIGHT_PATH = 'stUAVFlightPath',             // 无人机飞行轨迹
  
  // 设备控制相关
  DEVICE_STATUS = 'stDeviceStatus',                // 设备状态
  CONTROL_COMMAND = 'stControlCommand',            // 控制命令
  COMMAND_RESPONSE = 'stCommandResponse',          // 命令响应
  
  // 任务相关
  TASK_ASSIGN = 'stTaskAssign',                    // 任务分配
  TASK_RESULT = 'stTaskResult',                    // 任务结果
  TASK_PROGRESS = 'stTaskProgress',                // 任务进度
  
  // 系统相关
  SYSTEM_CONFIG = 'stSystemConfig',                // 系统配置
  ALARM_INFO = 'stAlarmInfo',                      // 告警信息
  HEARTBEAT = 'heartbeat',                         // 心跳
}

// ==================== 消息处理器接口 ====================

/** 无人机目标处理器 */
interface UAVTargetHandlers {
  /** 目标信息上报 */
  onTargetReport?: (data: UAVTargetReportData) => void;
  /** 目标位置更新 */
  onTargetUpdate?: (data: UAVTargetUpdateData) => void;
  /** 飞行轨迹 */
  onFlightPath?: (data: UAVFlightPathData) => void;
}

/** 设备控制处理器 */
interface DeviceControlHandlers {
  /** 设备状态变化 */
  onDeviceStatus?: (data: DeviceStatusData) => void;
  /** 控制命令响应 */
  onCommandResponse?: (data: CommandResponseData) => void;
}

/** 任务处理器 */
interface TaskHandlers {
  /** 任务分配 */
  onTaskAssign?: (data: TaskAssignData) => void;
  /** 任务结果 */
  onTaskResult?: (data: TaskResultData) => void;
  /** 任务进度 */
  onTaskProgress?: (data: TaskProgressData) => void;
}

/** 系统处理器 */
interface SystemHandlers {
  /** 系统配置更新 */
  onSystemConfig?: (data: SystemConfigData) => void;
  /** 告警信息 */
  onAlarmInfo?: (data: AlarmInfoData) => void;
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

  private constructor() {
    console.log(`[MH] ═══════════════════════════════════`);
    console.log(`[MH] MessageHandler 单例已创建`);
    console.log(`[MH] ═══════════════════════════════════`);
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
    console.log(`[MH] ═══════════════════════════════════`);
    console.log(`[MH] 初始化 MessageHandler...`);
    
    if (this.isInitialized) {
      console.warn(`[MH] ⚠️ MessageHandler 已经初始化，无需重复初始化`);
      console.log(`[MH] ═══════════════════════════════════`);
      return;
    }
    
    this.wsService = wsService;
    this.isInitialized = true;
    
    console.log(`[MH] 绑定 WebSocket 服务...`);
    console.log(`[MH] 注册 'message' 事件监听器...`);
    
    // 监听消息事件（心跳 pong 已由 WebSocketService 处理）
    wsService.on('message', (data: any) => {
      this.dispatchMessage(data);
    });
    
    console.log(`[MH] ✅ MessageHandler 初始化完成`);
    console.log(`[MH] ═══════════════════════════════════`);
  }

  /**
   * 销毁，解除绑定
   */
  public destroy(): void {
    console.log(`[MH] ═══════════════════════════════════`);
    console.log(`[MH] 销毁 MessageHandler...`);
    
    if (this.wsService) {
      console.log(`[MH] 解除 WebSocket 绑定...`);
      this.wsService.off('message');
    }
    
    this.wsService = null;
    this.isInitialized = false;
    this.clearHandlers();
    
    console.log(`[MH] ✅ MessageHandler 已销毁`);
    console.log(`[MH] ═══════════════════════════════════`);
  }

  /**
   * 获取下一个消息ID（用于追踪）
   */
  private getNextMessageId(): string {
    this.messageId++;
    return `msg_${this.messageId}`;
  }

  // ==================== 消息分发（使用 switch 结构） ====================

  /**
   * 消息分发中心 - 使用 switch 结构
   */
  private dispatchMessage(message: any): void {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-RECV] ═══════════════════════════════════`);
    console.log(`[MH-RECV] [${msgId}] 收到新消息`);
    console.log(`[MH-RECV] [${msgId}] 消息ID: ${msgId}`);
    console.log(`[MH-RECV] [${msgId}] 原始消息:`, message);
    
    // 验证消息格式
    if (!this.validateMessage(message)) {
      console.warn(`[MH-RECV] [${msgId}] ❌ 消息格式验证失败`);
      console.log(`[MH-RECV] ═══════════════════════════════════`);
      return;
    }

    // 适配 WsPacket 格式：iCode 对应 type，iSelfData 对应 data
    const type = message.iCode || message.type;
    const data = message.iSelfData !== undefined ? message.iSelfData : message.data;
    
    console.log(`[MH-RECV] [${msgId}] 消息类型: ${type}`);
    console.log(`[MH-RECV] [${msgId}] 消息数据:`, data);
    
    // 使用 switch 结构分发消息
    console.log(`[MH-DISPATCH] [${msgId}] 开始分发消息...`);
    
    switch (type) {
      // ========== 无人机相关 ==========
      case MessageType.UAV_TARGET_REPORT:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleUAVTargetReport`);
        this.handleUAVTargetReport(data);
        break;
        
      case MessageType.UAV_TARGET_UPDATE:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleUAVTargetUpdate`);
        this.handleUAVTargetUpdate(data);
        break;
        
      case MessageType.UAV_FLIGHT_PATH:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleUAVFlightPath`);
        this.handleUAVFlightPath(data);
        break;

      // ========== 设备控制相关 ==========
      case MessageType.DEVICE_STATUS:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleDeviceStatus`);
        this.handleDeviceStatus(data);
        break;
        
      case MessageType.COMMAND_RESPONSE:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleCommandResponse`);
        this.handleCommandResponse(data);
        break;

      // ========== 任务相关 ==========
      case MessageType.TASK_ASSIGN:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleTaskAssign`);
        this.handleTaskAssign(data);
        break;
        
      case MessageType.TASK_RESULT:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleTaskResult`);
        this.handleTaskResult(data);
        break;
        
      case MessageType.TASK_PROGRESS:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleTaskProgress`);
        this.handleTaskProgress(data);
        break;

      // ========== 系统相关 ==========
      case MessageType.SYSTEM_CONFIG:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleSystemConfig`);
        this.handleSystemConfig(data);
        break;
        
      case MessageType.ALARM_INFO:
        console.log(`[MH-DISPATCH] [${msgId}] → 分发到 handleAlarmInfo`);
        this.handleAlarmInfo(data);
        break;

      // ========== 未知消息 ==========
      default:
        console.warn(`[MH-DISPATCH] [${msgId}] ⚠️ 未处理的消息类型: ${type}`);
        this.handleUnknownMessage(type, data);
        break;
    }
    
    console.log(`[MH-DISPATCH] [${msgId}] 消息分发完成`);
    console.log(`[MH-RECV] ═══════════════════════════════════`);
  }

  // ==================== 消息处理器实现 ====================

  /** 处理无人机目标上报 */
  private handleUAVTargetReport(data: UAVTargetReportData): void {
    console.log(`[MH] [stUAVTargetReport] 处理目标上报...`);
    console.log(`[MH] [stUAVTargetReport] 数据:`, data);
    
    if (this.uavHandlers.onTargetReport) {
      console.log(`[MH] [stUAVTargetReport] 找到处理器，执行回调...`);
      try {
        this.uavHandlers.onTargetReport(data);
        console.log(`[MH] [stUAVTargetReport] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stUAVTargetReport] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stUAVTargetReport] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理无人机目标更新 */
  private handleUAVTargetUpdate(data: UAVTargetUpdateData): void {
    console.log(`[MH] [stUAVTargetUpdate] 处理目标更新...`);
    console.log(`[MH] [stUAVTargetUpdate] 数据:`, data);
    
    if (this.uavHandlers.onTargetUpdate) {
      console.log(`[MH] [stUAVTargetUpdate] 找到处理器，执行回调...`);
      try {
        this.uavHandlers.onTargetUpdate(data);
        console.log(`[MH] [stUAVTargetUpdate] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stUAVTargetUpdate] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stUAVTargetUpdate] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理无人机飞行轨迹 */
  private handleUAVFlightPath(data: UAVFlightPathData): void {
    console.log(`[MH] [stUAVFlightPath] 处理飞行轨迹...`);
    console.log(`[MH] [stUAVFlightPath] 轨迹点数: ${data.points?.length || 0}`);
    
    if (this.uavHandlers.onFlightPath) {
      console.log(`[MH] [stUAVFlightPath] 找到处理器，执行回调...`);
      try {
        this.uavHandlers.onFlightPath(data);
        console.log(`[MH] [stUAVFlightPath] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stUAVFlightPath] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stUAVFlightPath] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理设备状态 */
  private handleDeviceStatus(data: DeviceStatusData): void {
    console.log(`[MH] [stDeviceStatus] 处理设备状态...`);
    console.log(`[MH] [stDeviceStatus] 设备ID: ${data.deviceId}, 状态: ${data.status}`);
    
    if (this.deviceHandlers.onDeviceStatus) {
      console.log(`[MH] [stDeviceStatus] 找到处理器，执行回调...`);
      try {
        this.deviceHandlers.onDeviceStatus(data);
        console.log(`[MH] [stDeviceStatus] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stDeviceStatus] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stDeviceStatus] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理命令响应 */
  private handleCommandResponse(data: CommandResponseData): void {
    console.log(`[MH] [stCommandResponse] 处理命令响应...`);
    console.log(`[MH] [stCommandResponse] 命令ID: ${data.commandId}, 结果: ${data.code}`);
    
    if (this.deviceHandlers.onCommandResponse) {
      console.log(`[MH] [stCommandResponse] 找到处理器，执行回调...`);
      try {
        this.deviceHandlers.onCommandResponse(data);
        console.log(`[MH] [stCommandResponse] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stCommandResponse] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stCommandResponse] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理任务分配 */
  private handleTaskAssign(data: TaskAssignData): void {
    console.log(`[MH] [stTaskAssign] 处理任务分配...`);
    console.log(`[MH] [stTaskAssign] 任务ID: ${data.taskId}, 类型: ${data.taskType}`);
    
    if (this.taskHandlers.onTaskAssign) {
      console.log(`[MH] [stTaskAssign] 找到处理器，执行回调...`);
      try {
        this.taskHandlers.onTaskAssign(data);
        console.log(`[MH] [stTaskAssign] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stTaskAssign] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stTaskAssign] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理任务结果 */
  private handleTaskResult(data: TaskResultData): void {
    console.log(`[MH] [stTaskResult] 处理任务结果...`);
    console.log(`[MH] [stTaskResult] 任务ID: ${data.taskId}, 成功: ${data.success}`);
    
    if (this.taskHandlers.onTaskResult) {
      console.log(`[MH] [stTaskResult] 找到处理器，执行回调...`);
      try {
        this.taskHandlers.onTaskResult(data);
        console.log(`[MH] [stTaskResult] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stTaskResult] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stTaskResult] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理任务进度 */
  private handleTaskProgress(data: TaskProgressData): void {
    console.log(`[MH] [stTaskProgress] 处理任务进度...`);
    console.log(`[MH] [stTaskProgress] 任务ID: ${data.taskId}, 进度: ${data.progress}%`);
    
    if (this.taskHandlers.onTaskProgress) {
      console.log(`[MH] [stTaskProgress] 找到处理器，执行回调...`);
      try {
        this.taskHandlers.onTaskProgress(data);
        console.log(`[MH] [stTaskProgress] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stTaskProgress] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stTaskProgress] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理系统配置 */
  private handleSystemConfig(data: SystemConfigData): void {
    console.log(`[MH] [stSystemConfig] 处理系统配置...`);
    console.log(`[MH] [stSystemConfig] 配置类型: ${data.configType}`);
    
    if (this.systemHandlers.onSystemConfig) {
      console.log(`[MH] [stSystemConfig] 找到处理器，执行回调...`);
      try {
        this.systemHandlers.onSystemConfig(data);
        console.log(`[MH] [stSystemConfig] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stSystemConfig] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stSystemConfig] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理告警信息 */
  private handleAlarmInfo(data: AlarmInfoData): void {
    console.log(`[MH] [stAlarmInfo] 处理告警信息...`);
    console.log(`[MH] [stAlarmInfo] 告警ID: ${data.alarmId}, 级别: ${data.level}`);
    console.log(`[MH] [stAlarmInfo] 告警消息: ${data.message}`);
    
    if (this.systemHandlers.onAlarmInfo) {
      console.log(`[MH] [stAlarmInfo] 找到处理器，执行回调...`);
      try {
        this.systemHandlers.onAlarmInfo(data);
        console.log(`[MH] [stAlarmInfo] ✅ 处理器执行成功`);
      } catch (error) {
        console.error(`[MH] [stAlarmInfo] ❌ 处理器执行失败:`, error);
      }
    } else {
      console.log(`[MH] [stAlarmInfo] ⚠️ 未注册处理器，已忽略`);
    }
  }

  /** 处理未知消息（可扩展） */
  private handleUnknownMessage(_type: string, _data: any): void {
    console.log(`[MH] [Unknown] 未知消息类型，无处理逻辑`);
  }

  // ==================== 验证 ====================

  private validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      console.warn(`[MH] 验证失败: message 不是对象`);
      return false;
    }
    // 适配 WsPacket 格式：iCode 对应 type
    if (typeof message.iCode !== 'string' && typeof message.type !== 'string') {
      console.warn(`[MH] 验证失败: message.iCode 或 message.type 不是字符串`);
      return false;
    }
    return true;
  }

  // ==================== 发送接口 ====================

  /**
   * 统一发送消息
   */
  public send(type: string, data?: any): boolean {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] ═══════════════════════════════════`);
    console.log(`[MH-SEND] [${msgId}] 准备发送消息`);
    console.log(`[MH-SEND] [${msgId}] 消息类型: ${type}`);
    console.log(`[MH-SEND] [${msgId}] 消息数据:`, data);
    
    if (!this.wsService) {
      console.error(`[MH-SEND] [${msgId}] ❌ WebSocket 服务未初始化`);
      console.log(`[MH-SEND] ═══════════════════════════════════`);
      return false;
    }

    // 使用 WsPacket 格式发送消息
    const payload = {
      iCode: type,
      iType: '0',
      iFrom: '0',
      iTo: '0',
      iTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      iSelfData: data
    };
    console.log(`[MH-SEND] [${msgId}] 封装消息 (WsPacket):`, payload);
    console.log(`[MH-SEND] [${msgId}] 调用 WebSocket.send()...`);
    
    this.wsService.send(payload as any);
    
    console.log(`[MH-SEND] [${msgId}] ✅ 消息已发送`);
    console.log(`[MH-SEND] ═══════════════════════════════════`);
    return true;
  }

  /**
   * 发送请求并等待响应
   */
  public sendRequest(type: string, data?: any, timeout: number = 30000): Promise<HandlerResult> {
    const msgId = this.getNextMessageId();
    
    console.log(`[MH-SEND] ═══════════════════════════════════`);
    console.log(`[MH-SEND] [${msgId}] 准备发送请求并等待响应`);
    console.log(`[MH-SEND] [${msgId}] 消息类型: ${type}`);
    console.log(`[MH-SEND] [${msgId}] 超时时间: ${timeout}ms`);
    
    return new Promise((resolve) => {
      if (!this.send(type, data)) {
        console.error(`[MH-SEND] [${msgId}] ❌ 发送失败`);
        console.log(`[MH-SEND] ═══════════════════════════════════`);
        resolve({ success: false, error: { code: -1, message: '发送失败' } });
        return;
      }

      console.log(`[MH-SEND] [${msgId}] 注册响应监听器...`);
      const responseType = `${type}Response`;
      const responseHandler = (response: any) => {
        if (response.type === responseType || response.type === `${type}_resp`) {
          console.log(`[MH-SEND] [${msgId}] 收到响应:`, response);
          this.wsService?.off(responseType, responseHandler);
          clearTimeout(timer);
          
          const result = {
            success: response.code === 0 || response.success,
            data: response.data,
            error: response.code !== 0 ? { code: response.code, message: response.message } : undefined
          };
          
          console.log(`[MH-SEND] [${msgId}] 响应结果:`, result);
          console.log(`[MH-SEND] ═══════════════════════════════════`);
          resolve(result);
        }
      };

      console.log(`[MH-SEND] [${msgId}] 启动超时定时器...`);
      const timer = setTimeout(() => {
        console.warn(`[MH-SEND] [${msgId}] ⚠️ 请求超时`);
        this.wsService?.off(responseType, responseHandler);
        console.log(`[MH-SEND] ═══════════════════════════════════`);
        resolve({ success: false, error: { code: -2, message: '请求超时' } });
      }, timeout);

      this.wsService?.on(responseType, responseHandler);
    });
  }

  // ==================== 处理器注册 ====================

  /** 注册无人机消息处理器 */
  public setUAVHandlers(handlers: UAVTargetHandlers): void {
    console.log(`[MH] 注册无人机消息处理器...`);
    console.log(`[MH] 注册的处理器:`, Object.keys(handlers));
    this.uavHandlers = { ...this.uavHandlers, ...handlers };
  }

  /** 注册设备控制消息处理器 */
  public setDeviceHandlers(handlers: DeviceControlHandlers): void {
    console.log(`[MH] 注册设备控制消息处理器...`);
    console.log(`[MH] 注册的处理器:`, Object.keys(handlers));
    this.deviceHandlers = { ...this.deviceHandlers, ...handlers };
  }

  /** 注册任务消息处理器 */
  public setTaskHandlers(handlers: TaskHandlers): void {
    console.log(`[MH] 注册任务消息处理器...`);
    console.log(`[MH] 注册的处理器:`, Object.keys(handlers));
    this.taskHandlers = { ...this.taskHandlers, ...handlers };
  }

  /** 注册系统消息处理器 */
  public setSystemHandlers(handlers: SystemHandlers): void {
    console.log(`[MH] 注册系统消息处理器...`);
    console.log(`[MH] 注册的处理器:`, Object.keys(handlers));
    this.systemHandlers = { ...this.systemHandlers, ...handlers };
  }

  /** 批量注册所有处理器 */
  public setAllHandlers(handlers: {
    uav?: UAVTargetHandlers;
    device?: DeviceControlHandlers;
    task?: TaskHandlers;
    system?: SystemHandlers;
  }): void {
    console.log(`[MH] 批量注册处理器...`);
    if (handlers.uav) {
      console.log(`[MH] - 无人机处理器:`, Object.keys(handlers.uav));
      this.setUAVHandlers(handlers.uav);
    }
    if (handlers.device) {
      console.log(`[MH] - 设备控制处理器:`, Object.keys(handlers.device));
      this.setDeviceHandlers(handlers.device);
    }
    if (handlers.task) {
      console.log(`[MH] - 任务处理器:`, Object.keys(handlers.task));
      this.setTaskHandlers(handlers.task);
    }
    if (handlers.system) {
      console.log(`[MH] - 系统处理器:`, Object.keys(handlers.system));
      this.setSystemHandlers(handlers.system);
    }
  }

  /** 清空所有处理器 */
  public clearHandlers(): void {
    console.log(`[MH] 清空所有消息处理器...`);
    this.uavHandlers = {};
    this.deviceHandlers = {};
    this.taskHandlers = {};
    this.systemHandlers = {};
    console.log(`[MH] ✅ 所有处理器已清空`);
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
export const sendMessage = (type: string, data?: any) => messageHandler.send(type, data);
export const sendRequest = (type: string, data?: any, timeout?: number) => 
  messageHandler.sendRequest(type, data, timeout);

// 导出类和枚举
export { MessageHandler };
