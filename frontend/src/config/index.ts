/**
 * 全局配置文件
 * 用于存储应用中使用的各种配置信息，方便后期维护管理
 */

/**
 * 地图服务配置
 * 注意：该服务地址为局域网IP，调试时请确保网络可达
 */
export const MAP_CONFIG = {
  // 地图服务基础地址
  BASE_URL: 'http://1.14.100.199:8888',
  
  // 地图页面路径
  MAP_PAGE_PATH: '/pages/yunjing.html',
  
  // 完整的地图服务URL
  get MAP_URL() {
    return `${this.BASE_URL}${this.MAP_PAGE_PATH}`;
  },
  
  // 是否启用地图服务（调试时可设置为false使用占位图）
  ENABLED: true,
  
  // iframe加载超时时间（毫秒）
  LOAD_TIMEOUT: 10000,
  
  // 地图通信重试次数
  RETRY_COUNT: 3,
  
  // 地图通信重试间隔（毫秒）
  RETRY_INTERVAL: 500,
};

/**
 * 后端API配置
 */
export const API_CONFIG = {
  // 后端服务地址
  BASE_URL: 'http://localhost:3000',
  
  // WebSocket服务地址
  WS_URL: 'ws://localhost:3000',
  
  // API请求超时时间（毫秒）
  TIMEOUT: 10000,
};

/**
 * 应用配置
 */
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

/**
 * 调试配置
 */
export const DEBUG_CONFIG = {
  // 是否开启调试模式
  ENABLED: true,
  
  // 是否模拟地图数据（当地图服务不可用时）
  MOCK_MAP_DATA: true,
};

export default {
  MAP_CONFIG,
  API_CONFIG,
  APP_CONFIG,
  DEBUG_CONFIG,
};
