/**
 * WebSocket 消息处理器
 * 统一处理接收消息（心跳除外）和提供统一发送接口
 * 
 * 使用 switch 结构管理消息类型，方便扩展
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
  
  // 处理器回调
  private uavHandlers: UAVTargetHandlers = {};
  private deviceHandlers: DeviceControlHandlers = {};
  private taskHandlers: TaskHandlers = {};
  private systemHandlers: SystemHandlers = {};

  private constructor() {}

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
    if (this.isInitialized) {
      console.warn('[MessageHandler] 已经初始化，无需重复初始化');
      return;
    }
    
    this.wsService = wsService;
    this.isInitialized = true;
    
    // 监听消息事件（心跳 pong 已由 WebSocketService 处理）
    wsService.on('message', (data: any) => {
      this.dispatchMessage(data);
    });
    
    console.log('[MessageHandler] 初始化完成');
  }

  /**
   * 销毁，解除绑定
   */
  public destroy(): void {
    if (this.wsService) {
      this.wsService.off('message');
    }
    this.wsService = null;
    this.isInitialized = false;
    console.log('[MessageHandler] 已销毁');
  }

  // ==================== 消息分发（使用 switch 结构） ====================

  /**
   * 消息分发中心 - 使用 switch 结构
   */
  private dispatchMessage(message: any): void {
    // 验证消息格式
    if (!this.validateMessage(message)) {
      console.warn('[MessageHandler] 收到无效消息格式:', message);
      return;
    }

    const { type, data } = message;

    // 使用 switch 结构分发消息
    switch (type) {
      // ========== 无人机相关 ==========
      case MessageType.UAV_TARGET_REPORT:
        this.handleUAVTargetReport(data);
        break;
        
      case MessageType.UAV_TARGET_UPDATE:
        this.handleUAVTargetUpdate(data);
        break;
        
      case MessageType.UAV_FLIGHT_PATH:
        this.handleUAVFlightPath(data);
        break;

      // ========== 设备控制相关 ==========
      case MessageType.DEVICE_STATUS:
        this.handleDeviceStatus(data);
        break;
        
      case MessageType.COMMAND_RESPONSE:
        this.handleCommandResponse(data);
        break;

      // ========== 任务相关 ==========
      case MessageType.TASK_ASSIGN:
        this.handleTaskAssign(data);
        break;
        
      case MessageType.TASK_RESULT:
        this.handleTaskResult(data);
        break;
        
      case MessageType.TASK_PROGRESS:
        this.handleTaskProgress(data);
        break;

      // ========== 系统相关 ==========
      case MessageType.SYSTEM_CONFIG:
        this.handleSystemConfig(data);
        break;
        
      case MessageType.ALARM_INFO:
        this.handleAlarmInfo(data);
        break;

      // ========== 未知消息 ==========
      default:
        console.warn(`[MessageHandler] 未处理的消息类型: ${type}`, message);
        this.handleUnknownMessage(type, data);
        break;
    }
  }

  // ==================== 消息处理器实现 ====================

  /** 处理无人机目标上报 */
  private handleUAVTargetReport(data: UAVTargetReportData): void {
    if (this.uavHandlers.onTargetReport) {
      this.uavHandlers.onTargetReport(data);
    }
  }

  /** 处理无人机目标更新 */
  private handleUAVTargetUpdate(data: UAVTargetUpdateData): void {
    if (this.uavHandlers.onTargetUpdate) {
      this.uavHandlers.onTargetUpdate(data);
    }
  }

  /** 处理无人机飞行轨迹 */
  private handleUAVFlightPath(data: UAVFlightPathData): void {
    if (this.uavHandlers.onFlightPath) {
      this.uavHandlers.onFlightPath(data);
    }
  }

  /** 处理设备状态 */
  private handleDeviceStatus(data: DeviceStatusData): void {
    if (this.deviceHandlers.onDeviceStatus) {
      this.deviceHandlers.onDeviceStatus(data);
    }
  }

  /** 处理命令响应 */
  private handleCommandResponse(data: CommandResponseData): void {
    if (this.deviceHandlers.onCommandResponse) {
      this.deviceHandlers.onCommandResponse(data);
    }
  }

  /** 处理任务分配 */
  private handleTaskAssign(data: TaskAssignData): void {
    if (this.taskHandlers.onTaskAssign) {
      this.taskHandlers.onTaskAssign(data);
    }
  }

  /** 处理任务结果 */
  private handleTaskResult(data: TaskResultData): void {
    if (this.taskHandlers.onTaskResult) {
      this.taskHandlers.onTaskResult(data);
    }
  }

  /** 处理任务进度 */
  private handleTaskProgress(data: TaskProgressData): void {
    if (this.taskHandlers.onTaskProgress) {
      this.taskHandlers.onTaskProgress(data);
    }
  }

  /** 处理系统配置 */
  private handleSystemConfig(data: SystemConfigData): void {
    if (this.systemHandlers.onSystemConfig) {
      this.systemHandlers.onSystemConfig(data);
    }
  }

  /** 处理告警信息 */
  private handleAlarmInfo(data: AlarmInfoData): void {
    if (this.systemHandlers.onAlarmInfo) {
      this.systemHandlers.onAlarmInfo(data);
    }
  }

  /** 处理未知消息（可扩展） */
  private handleUnknownMessage(_type: string, _data: any): void {
    // 可在此处添加默认处理逻辑或记录
  }

  // ==================== 验证 ====================

  private validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') return false;
    if (typeof message.type !== 'string') return false;
    return true;
  }

  // ==================== 发送接口 ====================

  /**
   * 统一发送消息
   */
  public send(type: string, data?: any): boolean {
    if (!this.wsService) {
      console.error('[MessageHandler] 未初始化 WebSocket 服务');
      return false;
    }

    const payload = { type, ...(data !== undefined ? { data } : {}) };
    this.wsService.send(payload as any);
    return true;
  }

  /**
   * 发送请求并等待响应
   */
  public sendRequest(type: string, data?: any, timeout: number = 30000): Promise<HandlerResult> {
    return new Promise((resolve) => {
      if (!this.send(type, data)) {
        resolve({ success: false, error: { code: -1, message: '发送失败' } });
        return;
      }

      const responseType = `${type}Response`;
      const responseHandler = (response: any) => {
        if (response.type === responseType || response.type === `${type}_resp`) {
          this.wsService?.off(responseType, responseHandler);
          clearTimeout(timer);
          resolve({
            success: response.code === 0 || response.success,
            data: response.data,
            error: response.code !== 0 ? { code: response.code, message: response.message } : undefined
          });
        }
      };

      const timer = setTimeout(() => {
        this.wsService?.off(responseType, responseHandler);
        resolve({ success: false, error: { code: -2, message: '请求超时' } });
      }, timeout);

      this.wsService?.on(responseType, responseHandler);
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
