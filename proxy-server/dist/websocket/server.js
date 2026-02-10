"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServerInstance = void 0;
const ws_1 = require("ws");
const http_1 = require("http");
const logger_1 = __importDefault(require("../utils/logger"));
class WebSocketServerInstance {
    constructor(wsConfig) {
        this.heartbeatIntervalMap = new Map();
        this.connectionCount = 0;
        // 事件发射器
        this.events = new Map();
        this.config = wsConfig;
        this.httpServer = (0, http_1.createServer)();
        this.wss = new ws_1.WebSocketServer({
            server: this.httpServer,
            path: wsConfig.path,
            maxPayload: 1024 * 1024 // 1MB
        });
        this.setupServer();
    }
    setupServer() {
        this.wss.on('connection', this.handleConnection.bind(this));
        this.wss.on('close', () => {
            logger_1.default.info('WebSocket server closed');
        });
        this.wss.on('error', (error) => {
            logger_1.default.error('WebSocket server error:', error);
        });
    }
    handleConnection(ws, req) {
        // 连接数限制
        if (this.connectionCount >= this.config.maxConnections) {
            logger_1.default.warn('Max connections reached, rejecting new connection');
            ws.close(1008, 'Max connections reached');
            return;
        }
        this.connectionCount++;
        const sessionId = this.generateSessionId();
        logger_1.default.info(`New WebSocket connection: ${sessionId}, total: ${this.connectionCount}`);
        // 设置WebSocket元数据
        ws.metadata = {
            sessionId,
            connectedAt: new Date(),
            lastActivity: new Date(),
            subscriptions: new Set()
        };
        // 设置消息处理器
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('pong', () => this.handlePong(ws));
        ws.on('close', () => this.handleDisconnection(ws));
        ws.on('error', (error) => {
            logger_1.default.error(`WebSocket error for ${sessionId}:`, error);
        });
        // 启动心跳
        this.startHeartbeat(ws);
        // 发送连接成功消息
        this.send(ws, {
            type: 'connected',
            sessionId,
            timestamp: Date.now()
        });
        // 触发连接事件
        this.emit('connection', ws);
    }
    handleMessage(ws, data) {
        const sessionId = ws.metadata?.sessionId;
        try {
            const message = JSON.parse(data.toString());
            // 更新活动时间
            ws.metadata.lastActivity = new Date();
            // 触发消息事件
            this.emit('message', ws, message);
        }
        catch (error) {
            logger_1.default.error(`Failed to handle message from ${sessionId}:`, error);
            this.send(ws, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: Date.now()
            });
        }
    }
    handlePong(ws) {
        // 重置心跳超时
        const heartbeatTimer = this.heartbeatIntervalMap.get(ws);
        if (heartbeatTimer) {
            clearTimeout(heartbeatTimer);
            this.startHeartbeat(ws);
        }
    }
    handleDisconnection(ws) {
        const sessionId = ws.metadata?.sessionId;
        // 清理心跳定时器
        const heartbeatTimer = this.heartbeatIntervalMap.get(ws);
        if (heartbeatTimer) {
            clearTimeout(heartbeatTimer);
            this.heartbeatIntervalMap.delete(ws);
        }
        // 清理订阅
        if (ws.metadata?.subscriptions) {
            ws.metadata.subscriptions.clear();
        }
        this.connectionCount--;
        logger_1.default.info(`WebSocket disconnected: ${sessionId}, remaining: ${this.connectionCount}`);
        // 触发断开事件
        this.emit('disconnect', ws);
    }
    startHeartbeat(ws) {
        // 清除旧的心跳定时器
        const oldTimer = this.heartbeatIntervalMap.get(ws);
        if (oldTimer) {
            clearTimeout(oldTimer);
        }
        // 设置新的心跳超时定时器
        const timer = setTimeout(() => {
            logger_1.default.warn(`Heartbeat timeout for ${ws.metadata?.sessionId}, closing connection`);
            ws.terminate();
        }, this.config.heartbeatTimeout);
        this.heartbeatIntervalMap.set(ws, timer);
        // 发送ping
        ws.ping();
    }
    send(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    broadcast(message, filter) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                if (!filter || filter(client)) {
                    this.send(client, message);
                }
            }
        });
    }
    start() {
        this.httpServer.listen(this.config.port, () => {
            logger_1.default.info(`WebSocket server started on port ${this.config.port}`);
        });
    }
    stop() {
        this.wss.close();
        this.httpServer.close();
        logger_1.default.info('WebSocket server stopped');
    }
    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(handler);
    }
    emit(event, ...args) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }
    getConnectionCount() {
        return this.connectionCount;
    }
}
exports.WebSocketServerInstance = WebSocketServerInstance;
exports.default = WebSocketServerInstance;
//# sourceMappingURL=server.js.map