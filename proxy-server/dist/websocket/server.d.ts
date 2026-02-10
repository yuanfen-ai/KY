import { WebSocket } from 'ws';
export interface WebSocketServerConfig {
    port: number;
    path: string;
    heartbeatInterval: number;
    heartbeatTimeout: number;
    maxConnections: number;
}
export declare class WebSocketServerInstance {
    private wss;
    private httpServer;
    private config;
    private heartbeatIntervalMap;
    private connectionCount;
    constructor(wsConfig: WebSocketServerConfig);
    private setupServer;
    private handleConnection;
    private handleMessage;
    private handlePong;
    private handleDisconnection;
    private startHeartbeat;
    private send;
    private generateSessionId;
    broadcast(message: any, filter?: (ws: WebSocket) => boolean): void;
    start(): void;
    stop(): void;
    private events;
    on(event: string, handler: Function): void;
    private emit;
    getConnectionCount(): number;
}
export default WebSocketServerInstance;
//# sourceMappingURL=server.d.ts.map