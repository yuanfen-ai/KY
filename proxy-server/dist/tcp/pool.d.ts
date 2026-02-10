import { EventEmitter } from 'events';
import { TCPClientConfig } from './client';
export declare class TCPConnectionPool extends EventEmitter {
    private connections;
    private reconnectQueue;
    constructor();
    private setupEventHandlers;
    addDevice(config: TCPClientConfig): Promise<void>;
    removeDevice(deviceId: string): void;
    sendToDevice(deviceId: string, command: any): Promise<any>;
    private scheduleReconnect;
    getConnectedDevices(): string[];
    getDeviceCount(): number;
    disconnectAll(): void;
}
export declare const tcpConnectionPool: TCPConnectionPool;
//# sourceMappingURL=pool.d.ts.map