"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const ws_1 = require("ws");
const logger_1 = __importDefault(require("../utils/logger"));
const device_1 = __importDefault(require("../models/device"));
const pool_1 = require("../tcp/pool");
class MessageHandler {
    constructor(wsServer) {
        this.wsServer = wsServer;
    }
    async handle(ws, message) {
        const sessionId = ws.metadata?.sessionId;
        logger_1.default.debug(`Received message from ${sessionId}:`, message);
        switch (message.type) {
            case 'ping':
                this.handlePing(ws);
                break;
            case 'subscribe':
                await this.handleSubscribe(ws, message);
                break;
            case 'unsubscribe':
                await this.handleUnsubscribe(ws, message);
                break;
            case 'command':
                await this.handleCommand(ws, message);
                break;
            case 'getDeviceList':
                await this.handleGetDeviceList(ws);
                break;
            default:
                logger_1.default.warn(`Unknown message type: ${message.type}`);
                this.sendError(ws, 'Unknown message type');
        }
    }
    handlePing(ws) {
        this.send(ws, {
            type: 'pong',
            timestamp: Date.now()
        });
    }
    async handleSubscribe(ws, message) {
        const { deviceId } = message;
        const sessionId = ws.metadata?.sessionId;
        if (!deviceId) {
            this.sendError(ws, 'Device ID is required');
            return;
        }
        // 验证设备是否存在
        const device = await device_1.default.findOne({ where: { device_id: deviceId } });
        if (!device) {
            this.sendError(ws, 'Device not found');
            return;
        }
        // 添加订阅
        if (!ws.metadata.subscriptions) {
            ws.metadata.subscriptions = new Set();
        }
        ws.metadata.subscriptions.add(deviceId);
        logger_1.default.info(`${sessionId} subscribed to device ${deviceId}`);
        this.send(ws, {
            type: 'subscribed',
            deviceId,
            timestamp: Date.now()
        });
    }
    async handleUnsubscribe(ws, message) {
        const { deviceId } = message;
        const sessionId = ws.metadata?.sessionId;
        if (ws.metadata?.subscriptions) {
            ws.metadata.subscriptions.delete(deviceId);
        }
        logger_1.default.info(`${sessionId} unsubscribed from device ${deviceId}`);
        this.send(ws, {
            type: 'unsubscribed',
            deviceId,
            timestamp: Date.now()
        });
    }
    async handleCommand(ws, message) {
        const { deviceId, data } = message;
        const sessionId = ws.metadata?.sessionId;
        if (!deviceId || !data?.command) {
            this.sendError(ws, 'Device ID and command are required');
            return;
        }
        try {
            // 验证设备
            const device = await device_1.default.findOne({ where: { device_id: deviceId } });
            if (!device) {
                this.send(ws, {
                    type: 'deviceResponse',
                    deviceId,
                    status: 'error',
                    message: 'Device not found',
                    timestamp: Date.now()
                });
                return;
            }
            // 检查设备状态
            if (device.status !== 'online') {
                this.send(ws, {
                    type: 'deviceResponse',
                    deviceId,
                    status: 'error',
                    message: 'Device is not online',
                    timestamp: Date.now()
                });
                return;
            }
            // 发送到TCP设备
            const result = await pool_1.tcpConnectionPool.sendToDevice(deviceId, {
                type: 'command',
                command: data.command,
                params: data.params
            });
            this.send(ws, {
                type: 'deviceResponse',
                deviceId,
                status: 'success',
                result,
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to send command to device ${deviceId}:`, error);
            this.send(ws, {
                type: 'deviceResponse',
                deviceId,
                status: 'error',
                message: error.message,
                timestamp: Date.now()
            });
        }
    }
    async handleGetDeviceList(ws) {
        try {
            const devices = await device_1.default.findAll();
            this.send(ws, {
                type: 'deviceList',
                devices: devices.map(d => d.toJSON()),
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.default.error('Failed to get device list:', error);
            this.sendError(ws, 'Failed to get device list');
        }
    }
    handleDisconnect(ws) {
        // 清理订阅
        if (ws.metadata?.subscriptions) {
            ws.metadata.subscriptions.clear();
        }
    }
    send(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, message) {
        this.send(ws, {
            type: 'error',
            message,
            timestamp: Date.now()
        });
    }
    // 广播设备数据到订阅的客户端
    broadcastDeviceData(deviceId, data) {
        const message = {
            type: 'deviceData',
            deviceId,
            data,
            timestamp: Date.now()
        };
        // 广播给订阅该设备的所有客户端
        this.wsServer.broadcast(message, (ws) => {
            return ws.metadata?.subscriptions?.has(deviceId);
        });
        logger_1.default.debug(`Broadcasted data for device ${deviceId}`);
    }
}
exports.MessageHandler = MessageHandler;
exports.default = MessageHandler;
//# sourceMappingURL=handler.js.map