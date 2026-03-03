"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const config_1 = require("./config");
const logger_1 = __importDefault(require("./utils/logger"));
const server_1 = __importDefault(require("./websocket/server"));
const handler_1 = __importDefault(require("./websocket/handler"));
const pool_1 = require("./tcp/pool");
const device_1 = __importDefault(require("./models/device"));
async function startServer() {
    try {
        logger_1.default.info('Starting KY Proxy Server...');
        logger_1.default.info(`Environment: ${config_1.config.env}`);
        // 连接数据库（可选）
        let databaseConnected = false;
        try {
            await (0, database_1.connectDatabase)();
            databaseConnected = true;
            logger_1.default.info('Database connection established');
        }
        catch (error) {
            logger_1.default.warn('Database connection failed, running in demo mode without database');
            logger_1.default.error('Database error:', error);
        }
        // 创建WebSocket服务器
        const wsServer = new server_1.default({
            port: config_1.config.ws.port,
            path: config_1.config.ws.path,
            heartbeatInterval: config_1.config.ws.heartbeatInterval,
            heartbeatTimeout: config_1.config.ws.heartbeatTimeout,
            maxConnections: config_1.config.ws.maxConnections
        });
        // 创建消息处理器
        const messageHandler = new handler_1.default(wsServer);
        // 设置WebSocket事件监听
        wsServer.on('connection', (ws) => {
            // 新连接
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    messageHandler.handle(ws, message);
                }
                catch (error) {
                    logger_1.default.error('Failed to parse message:', error);
                }
            });
        });
        wsServer.on('message', (ws, message) => {
            messageHandler.handle(ws, message);
        });
        wsServer.on('disconnect', (ws) => {
            messageHandler.handleDisconnect(ws);
        });
        // 设置TCP设备数据广播
        pool_1.tcpConnectionPool.on('deviceData', (deviceId, data) => {
            messageHandler.broadcastDeviceData(deviceId, data);
        });
        // 启动WebSocket服务器
        wsServer.start();
        logger_1.default.info('WebSocket server started');
        // 加载设备并添加到TCP连接池（仅当数据库连接成功时）
        if (databaseConnected) {
            const devices = await device_1.default.findAll();
            logger_1.default.info(`Found ${devices.length} devices in database`);
            for (const device of devices) {
                try {
                    await pool_1.tcpConnectionPool.addDevice({
                        deviceId: device.device_id,
                        host: device.tcp_host,
                        port: device.tcp_port
                    });
                    logger_1.default.info(`Device ${device.device_id} added to TCP pool`);
                }
                catch (error) {
                    logger_1.default.error(`Failed to add device ${device.device_id} to TCP pool:`, error);
                }
            }
        }
        else {
            logger_1.default.info('Skipping device loading - running in demo mode');
        }
        logger_1.default.info('Server started successfully');
        // 优雅关闭
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
        async function gracefulShutdown() {
            logger_1.default.info('Received shutdown signal, closing connections...');
            wsServer.stop();
            pool_1.tcpConnectionPool.disconnectAll();
            if (databaseConnected) {
                await (0, database_1.closeDatabase)();
            }
            logger_1.default.info('Server stopped');
            process.exit(0);
        }
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
// 启动服务器
startServer();
//# sourceMappingURL=index.js.map