import { Model, Optional } from 'sequelize';
interface DeviceAttributes {
    id: number;
    device_id: string;
    device_name: string;
    device_type: string;
    tcp_host: string;
    tcp_port: number;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: Date | null;
    metadata: any;
    created_at: Date;
    updated_at: Date;
}
interface DeviceCreationAttributes extends Optional<DeviceAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class Device extends Model<DeviceAttributes, DeviceCreationAttributes> implements DeviceAttributes {
    id: number;
    device_id: string;
    device_name: string;
    device_type: string;
    tcp_host: string;
    tcp_port: number;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: Date | null;
    metadata: any;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default Device;
//# sourceMappingURL=device.d.ts.map