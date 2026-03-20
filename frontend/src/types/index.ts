// WebSocket消息类型定义

// WebSocket 数据包（平铺结构，无 header 嵌套）
export interface WsPacket {
  iCode: string;       // 数据类别码（字符串类型，心跳码为"00000"）
  iType: string;       // 消息类型（默认"0"）
  iFrom: string;       // 来源标识（默认"0"）
  iTo: string;         // 目标标识（默认"0"）
  iSelfData?: any;    // 数据区（替换原data字段）
}

// WebSocket 配置
export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (data: WsPacket) => void;
  onError?: (error: Event) => void;
}

// 心跳消息码常量（不使用枚举，直接使用字符串）
export const HeartbeatCode = '00000';

// 消息码定义（iCode - 数值型枚举）
export enum MessageCode {
  SYSTEM_STATUS = 1003,         // 系统状态
  SYSTEM_CONNECTED = 1004,       // 连接成功
  SYSTEM_ERROR = 1005,           // 系统错误

  // 无人机消息 (iCode: 2000-2999)
  DRONE_LIST = 2001,             // 无人机列表
  DRONE_UPDATE = 2002,           // 无人机状态更新
  DRONE_ADD = 2003,              // 新增无人机
  DRONE_REMOVE = 2004,           // 移除无人机
  DRONE_DETAIL = 2005,           // 无人机详情

  // 目标检测消息 (iCode: 3000-3999)
  TARGET_DETECTED = 3001,        // 目标检测
  TARGET_UPDATE = 3002,          // 目标更新
  TARGET_LOST = 3003,            // 目标丢失

  // 控制命令消息 (iCode: 4000-4999)
  COMMAND_TRACK_START = 4001,    // 开始跟踪
  COMMAND_TRACK_STOP = 4002,     // 停止跟踪
  COMMAND_DEVICE_CONTROL = 4003, // 设备控制
  COMMAND_RESPONSE = 4004,        // 命令响应

  // 查询消息 (iCode: 5000-5999)
  QUERY_DRONE_LIST = 5001,        // 查询无人机列表
  QUERY_SYSTEM_STATUS = 5002,    // 查询系统状态
  QUERY_NO_FLY_ZONES = 5003,    // 查询禁飞区
  QUERY_TARGET_LIST = 5004,       // 查询目标列表
  QUERY_DEVICE_LIST = 5005,       // 查询设备列表

  // 设备消息 (iCode: 7000-7999)
  DEVICE_DATA = 7001,            // 设备数据
  DEVICE_LIST = 7002,           // 设备列表
  DEVICE_SUBSCRIBE = 7003,      // 设备订阅
  DEVICE_UNSUBSCRIBE = 7004,     // 设备取消订阅

  // 禁飞区消息 (iCode: 6000-6999)
  ZONE_LIST = 6001,               // 禁飞区列表
  ZONE_ADD = 6002,               // 添加禁飞区
  ZONE_UPDATE = 6003,             // 更新禁飞区
  ZONE_REMOVE = 6004,           // 删除禁飞区

  // 日志消息 (iCode: 9000-9999)
  LOG_MESSAGE = 9001,            // 日志消息
}

// 兼容旧的消息格式（用于过渡期）
export interface LegacyMessagePayload {
  type: string;
  action: string;
  data?: any;
  timestamp?: number;
}

// 设备类型定义
export interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  tcp_host: string;
  tcp_port: number;
  status: 'online' | 'offline' | 'error';
  last_heartbeat: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// 设备数据类型
export interface DeviceData {
  deviceId: string;
  data: any;
  timestamp: number;
}

// 告警类型
export interface Alert {
  id: number;
  device_id: string;
  alert_type: string;
  alert_level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: any;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// 指令记录类型
export interface CommandRecord {
  id: number;
  session_id: string;
  device_id: string;
  command_type: string;
  command_payload: any;
  status: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
  response?: any;
  error_message?: string;
  created_at: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationData<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}
