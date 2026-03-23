/**
 * 全局配置文件
 * 用于存储应用中使用的各种配置信息，方便后期维护管理
 * 
 * 远程服务地址通过环境变量配置：
 * - VITE_MAP_TARGET: 地图服务远程地址
 * - VITE_WS_TARGET: WebSocket服务远程地址
 */

// ==================== 远程服务地址配置 ====================

// 地图服务远程地址（默认地址，可通过环境变量覆盖）
const MAP_TARGET = import.meta.env.VITE_MAP_TARGET || 'http://1.14.100.199:8888';

// WebSocket服务远程地址（默认地址，可通过环境变量覆盖）
const WS_TARGET = import.meta.env.VITE_WS_TARGET || 'ws://1.14.100.199:8050';

// ==================== 地图服务配置 ====================
export const MAP_CONFIG = {
  // 地图服务远程地址（供代理配置使用）
  REMOTE_URL: MAP_TARGET,
  
  // 地图页面路径
  MAP_PAGE_PATH: '/pages/yunjing.html',
  
  // 代理路径前缀
  PROXY_PREFIX: '/map-service',
  
  /**
   * 获取地图服务URL（代理模式）
   * 前端使用同源路径，通过后端代理访问远程地图服务
   */
  get MAP_URL() {
    return `${this.PROXY_PREFIX}${this.MAP_PAGE_PATH}`;
  },
  
  // 是否启用地图服务
  ENABLED: true,
  
  // iframe加载超时时间（毫秒）
  LOAD_TIMEOUT: 10000,
  
  // 地图通信重试次数
  RETRY_COUNT: 3,
  
  // 地图通信重试间隔（毫秒）
  RETRY_INTERVAL: 500,
  
  // 地图初始化延迟时间（毫秒）
  INIT_DELAY: 500,
  
  // 地图初始化重试延迟时间（毫秒）
  INIT_RETRY_DELAY: 2000,
  
  /**
   * 获取代理后的完整资源URL
   * @param path 原始路径
   */
  getProxyUrl(path: string): string {
    if (path.startsWith('http')) {
      try {
        const url = new URL(path);
        path = url.pathname + url.search;
      } catch (e) {
        console.error('Invalid URL:', path);
      }
    }
    return `${this.PROXY_PREFIX}${path}`;
  }
};

// ==================== WebSocket 配置 ====================
export const WS_CONFIG = {
  // WebSocket服务远程地址（供代理配置使用）
  REMOTE_URL: WS_TARGET,
  
  // WebSocket服务地址（代理路径，前端使用同源）
  URL: '/ws',
  
  // 启用状态
  ENABLED: true,
  
  // 自动重连次数
  RECONNECT_ATTEMPTS: 5,
  
  // 重连间隔（毫秒）
  RECONNECT_INTERVAL: 3000,
  
  // 心跳间隔（毫秒）
  HEARTBEAT_INTERVAL: 30000,
  
  // 心跳超时时间（毫秒）
  HEARTBEAT_TIMEOUT: 5000,
};

// ==================== API配置 ====================
export const API_CONFIG = {
  // 后端服务地址
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // API请求超时时间（毫秒）
  TIMEOUT: 10000,
};

// ==================== 应用配置 ====================
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: '手持式察打一体枪',
  
  // 默认设备ID
  DEFAULT_DEVICE_ID: 'DEVICE_001',
  
  // 登录状态存储键
  LOGIN_STORAGE_KEY: 'isLoggedIn',
  
  // Token存储键
  TOKEN_STORAGE_KEY: 'authToken',
};

// ==================== 调试配置 ====================
export const DEBUG_CONFIG = {
  // 是否开启调试模式
  ENABLED: true,
  
  // 是否模拟地图数据
  MOCK_MAP_DATA: true,
};

export default {
  MAP_CONFIG,
  API_CONFIG,
  WS_CONFIG,
  APP_CONFIG,
  DEBUG_CONFIG,
};
