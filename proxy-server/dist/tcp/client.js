"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TCPClient = void 0;
const net_1 = require("net");
const events_1 = require("events");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
class TCPClient extends events_1.EventEmitter {
    constructor(inputConfig) {
        super();
        this.socket = null;
        this.isConnectedFlag = false;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.responseCallbacks = new Map();
        this.config = {
            deviceId: inputConfig.deviceId,
            host: inputConfig.host,
            port: inputConfig.port,
            reconnectInterval: inputConfig.reconnectInterval ?? config_1.config.tcp.reconnectInterval,
            heartbeatInterval: inputConfig.heartbeatInterval ?? config_1.config.tcp.heartbeatInterval
        };
    }
    async connect() {
        return new Promise((resolve, reject) => {
            if (this.socket) {
                this.disconnect();
            }
            logger_1.default.info(`Connecting to device ${this.config.deviceId} at ${this.config.host}:${this.config.port}`);
            this.socket = new net_1.Socket();
            this.socket.setTimeout(10000); // 10秒连接超时
            this.socket.on('connect', () => {
                logger_1.default.info(`Device ${this.config.deviceId} connected`);
                this.isConnectedFlag = true;
                this.startHeartbeat();
                this.emit('connected');
                resolve();
            });
            this.socket.on('data', (data) => {
                this.handleData(data);
            });
            this.socket.on('error', (error) => {
                logger_1.default.error(`Device ${this.config.deviceId} socket error:`, error);
                this.emit('error', error);
            });
            this.socket.on('close', () => {
                logger_1.default.info(`Device ${this.config.deviceId} connection closed`);
                this.handleDisconnect();
            });
            this.socket.on('timeout', () => {
                logger_1.default.error(`Device ${this.config.deviceId} connection timeout`);
                this.socket?.destroy();
            });
            this.socket.connect(this.config.port, this.config.host);
        });
    }
    disconnect() {
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.isConnectedFlag = false;
    }
    send(command, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnectedFlag) {
                reject(new Error('Not connected'));
                return;
            }
            const requestId = this.generateRequestId();
            const payload = JSON.stringify({
                requestId,
                ...command,
                timestamp: Date.now()
            });
            // 设置响应回调
            const timer = setTimeout(() => {
                this.responseCallbacks.delete(requestId);
                reject(new Error('Command timeout'));
            }, timeout);
            this.responseCallbacks.set(requestId, (data) => {
                clearTimeout(timer);
                resolve(data);
            });
            // 发送数据
            this.socket.write(payload + '\n', (error) => {
                if (error) {
                    clearTimeout(timer);
                    this.responseCallbacks.delete(requestId);
                    reject(error);
                }
            });
            logger_1.default.debug(`Sent command to ${this.config.deviceId}:`, command);
        });
    }
    isConnected() {
        return this.isConnectedFlag;
    }
    handleData(data) {
        try {
            const messages = data.toString().split('\n').filter(Boolean);
            for (const message of messages) {
                const parsed = JSON.parse(message);
                logger_1.default.debug(`Received data from ${this.config.deviceId}:`, parsed);
                // 处理响应
                if (parsed.requestId && this.responseCallbacks.has(parsed.requestId)) {
                    const callback = this.responseCallbacks.get(parsed.requestId);
                    callback(parsed);
                    this.responseCallbacks.delete(parsed.requestId);
                }
                else {
                    // 上报数据
                    this.emit('data', parsed);
                }
            }
        }
        catch (error) {
            logger_1.default.error(`Failed to parse data from ${this.config.deviceId}:`, error);
        }
    }
    handleDisconnect() {
        if (this.isConnectedFlag) {
            this.isConnectedFlag = false;
            this.stopHeartbeat();
            this.emit('disconnected');
            // 清理所有待处理的回调
            this.responseCallbacks.forEach((callback) => {
                callback({ error: 'Connection lost' });
            });
            this.responseCallbacks.clear();
            // 触发重连
            this.scheduleReconnect();
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (error) {
                logger_1.default.error(`Failed to reconnect device ${this.config.deviceId}:`, error);
                this.scheduleReconnect();
            }
        }, this.config.reconnectInterval);
    }
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.socket && this.isConnectedFlag) {
                this.socket.write(JSON.stringify({
                    type: 'heartbeat',
                    timestamp: Date.now()
                }) + '\n');
            }
        }, this.config.heartbeatInterval);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.TCPClient = TCPClient;
exports.default = TCPClient;
//# sourceMappingURL=client.js.map