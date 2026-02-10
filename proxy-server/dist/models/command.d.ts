import { Model, Optional } from 'sequelize';
interface CommandRecordAttributes {
    id: number;
    session_id: string;
    device_id: string;
    command_type: string;
    command_payload: any;
    status: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
    response: any;
    error_message: string;
    created_at: Date;
    updated_at: Date;
}
interface CommandRecordCreationAttributes extends Optional<CommandRecordAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class CommandRecord extends Model<CommandRecordAttributes, CommandRecordCreationAttributes> implements CommandRecordAttributes {
    id: number;
    session_id: string;
    device_id: string;
    command_type: string;
    command_payload: any;
    status: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
    response: any;
    error_message: string;
    readonly created_at: Date;
    readonly updated_at: Date;
}
export default CommandRecord;
//# sourceMappingURL=command.d.ts.map