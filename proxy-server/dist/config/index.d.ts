export declare const config: {
    env: string;
    ws: {
        port: number;
        path: string;
        maxConnections: number;
        heartbeatInterval: number;
        heartbeatTimeout: number;
    };
    tcp: {
        reconnectInterval: number;
        heartbeatInterval: number;
    };
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
        poolMax: number;
        poolMin: number;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    log: {
        level: string;
        filePath: string;
    };
};
//# sourceMappingURL=index.d.ts.map