// WebSocket消息类型定义
export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

export interface MessagePayload {
  type: string;
  deviceId?: string;
  data?: any;
  timestamp: number;
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
// 构建时间戳：2026-03-03T16:32:00Z
// 版本：v2.1.0-security-fixed
// 修复：完全移除Vite HMR，使用纯静态文件服务器
