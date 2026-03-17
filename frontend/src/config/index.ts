/**
 * 全局配置文件
 * 用于存储应用中使用的各种配置信息，方便后期维护管理
 */

/**
 * 地图服务配置
 * 注意：由于HTTPS混合内容限制，需要通过代理访问HTTP地图服务
 */
export const MAP_CONFIG = {
  // 地图服务实际地址（仅供参考，前端不直接访问）
  ACTUAL_URL: 'http://1.14.100.199:8888',
  
  // 地图页面路径
  MAP_PAGE_PATH: '/pages/yunjing.html',
  
  // 代理路径前缀（Vite开发代理）
  PROXY_PREFIX: '/map-service',
  
  /**
   * 获取地图服务URL
   * 开发环境：使用Vite代理 /map-service -> http://1.14.100.199:8888
   * 生产环境：需要配置后端代理服务器
   */
  get MAP_URL() {
    // 使用代理路径，解决HTTPS混合内容问题
    return `${this.PROXY_PREFIX}${this.MAP_PAGE_PATH}`;
  },
  
  // 是否启用地图服务（调试时可设置为false使用占位图）
  ENABLED: true,
  
  // iframe加载超时时间（毫秒）
  LOAD_TIMEOUT: 10000,
  
  // 地图通信重试次数
  RETRY_COUNT: 3,
  
  // 地图通信重试间隔（毫秒）
  RETRY_INTERVAL: 500,
  
  /**
   * 获取代理后的完整资源URL
   * @param path 原始路径，如 /pages/yunjing.html 或 /js/main.js
   */
  getProxyUrl(path: string): string {
    // 如果路径已经是完整URL，提取路径部分
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
