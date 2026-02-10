import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  
  ws: {
    port: parseInt(process.env.WS_PORT || '5000', 10),
    path: process.env.WS_PATH || '/ws',
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '5000', 10),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
    heartbeatTimeout: parseInt(process.env.WS_HEARTBEAT_TIMEOUT || '60000', 10)
  },
  
  tcp: {
    reconnectInterval: parseInt(process.env.TCP_RECONNECT_INTERVAL || '5000', 10),
    heartbeatInterval: parseInt(process.env.TCP_HEARTBEAT_INTERVAL || '60000', 10)
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'ky_project',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    poolMax: parseInt(process.env.DB_POOL_MAX || '100', 10),
    poolMin: parseInt(process.env.DB_POOL_MIN || '10', 10)
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  }
};
