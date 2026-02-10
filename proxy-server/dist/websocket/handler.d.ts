import { WebSocket } from 'ws';
export declare class MessageHandler {
    private wsServer;
    constructor(wsServer: any);
    handle(ws: WebSocket, message: any): Promise<void>;
    private handlePing;
    private handleSubscribe;
    private handleUnsubscribe;
    private handleCommand;
    private handleGetDeviceList;
    handleDisconnect(ws: WebSocket): void;
    private send;
    private sendError;
    broadcastDeviceData(deviceId: string, data: any): void;
}
export default MessageHandler;
//# sourceMappingURL=handler.d.ts.map