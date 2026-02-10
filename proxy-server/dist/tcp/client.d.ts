import { EventEmitter } from 'events';
export interface TCPClientConfig {
    deviceId: string;
    host: string;
    port: number;
    reconnectInterval?: number;
    heartbeatInterval?: number;
}
export declare class TCPClient extends EventEmitter {
    private socket;
    private config;
    private isConnectedFlag;
    private reconnectTimer;
    private heartbeatTimer;
    private responseCallbacks;
    constructor(inputConfig: TCPClientConfig);
    connect(): Promise<void>;
    disconnect(): void;
    send(command: any, timeout?: number): Promise<any>;
    isConnected(): boolean;
    private handleData;
    private handleDisconnect;
    private scheduleReconnect;
    private startHeartbeat;
    private stopHeartbeat;
    private generateRequestId;
}
export default TCPClient;
//# sourceMappingURL=client.d.ts.map