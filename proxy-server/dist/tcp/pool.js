"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tcpConnectionPool = exports.TCPConnectionPool = void 0;
const events_1 = require("events");
const client_1 = require("./client");
const logger_1 = __importDefault(require("../utils/logger"));
class TCPConnectionPool extends events_1.EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.reconnectQueue = new Set();
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on('deviceData', (deviceId, data) => {
            this.emit('deviceData', deviceId, data);
        });
        this.on('deviceConnected', (deviceId) => {
            logger_1.default.info(`Device ${deviceId} connected via TCP`);
            // 更新设备状态（这里需要注入设备服务）
        });
        this.on('deviceDisconnected', (deviceId) => {
            logger_1.default.warn(`Device ${deviceId} disconnected from TCP`);
            // 更新设备状态
        });
    }
    async addDevice(config) {
        const { deviceId } = config;
        if (this.connections.has(deviceId)) {
            logger_1.default.warn(`Device ${deviceId} already exists in pool`);
            return;
        }
        logger_1.default.info(`Adding device ${deviceId} to TCP pool`);
        const client = new client_1.TCPClient(config);
        // 设置事件监听
        client.on('data', (data) => {
            this.emit('deviceData', deviceId, data);
        });
        client.on('connected', () => {
            this.emit('deviceConnected', deviceId);
            this.reconnectQueue.delete(deviceId);
        });
        client.on('disconnected', () => {
            this.emit('deviceDisconnected', deviceId);
            this.scheduleReconnect(config);
        });
        client.on('error', (error) => {
            logger_1.default.error(`TCP client error for ${deviceId}:`, error);
        });
        this.connections.set(deviceId, client);
        await client.connect();
    }
    removeDevice(deviceId) {
        const client = this.connections.get(deviceId);
        if (client) {
            client.disconnect();
            this.connections.delete(deviceId);
            this.reconnectQueue.delete(deviceId);
            logger_1.default.info(`Device ${deviceId} removed from TCP pool`);
        }
    }
    sendToDevice(deviceId, command) {
        const client = this.connections.get(deviceId);
        if (!client || !client.isConnected()) {
            throw new Error(`Device ${deviceId} not connected`);
        }
        return client.send(command);
    }
    scheduleReconnect(config) {
        const { deviceId } = config;
        if (this.reconnectQueue.has(deviceId)) {
            return; // 已在重连队列中
        }
        this.reconnectQueue.add(deviceId);
        logger_1.default.info(`Scheduling reconnect for device ${deviceId}`);
        setTimeout(async () => {
            if (!this.connections.has(deviceId)) {
                return; // 设备已被移除
            }
            try {
                await this.connections.get(deviceId).connect();
            }
            catch (error) {
                logger_1.default.error(`Failed to reconnect device ${deviceId}:`, error);
                this.scheduleReconnect(config);
            }
        }, config.reconnectInterval);
    }
    getConnectedDevices() {
        const connected = [];
        this.connections.forEach((client, deviceId) => {
            if (client.isConnected()) {
                connected.push(deviceId);
            }
        });
        return connected;
    }
    getDeviceCount() {
        return this.connections.size;
    }
    disconnectAll() {
        this.connections.forEach((client) => {
            client.disconnect();
        });
        this.connections.clear();
        this.reconnectQueue.clear();
    }
}
exports.TCPConnectionPool = TCPConnectionPool;
exports.tcpConnectionPool = new TCPConnectionPool();
//# sourceMappingURL=pool.js.map