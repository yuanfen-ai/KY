import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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

interface CommandRecordCreationAttributes extends Optional<CommandRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class CommandRecord extends Model<CommandRecordAttributes, CommandRecordCreationAttributes> implements CommandRecordAttributes {
  public id!: number;
  public session_id!: string;
  public device_id!: string;
  public command_type!: string;
  public command_payload!: any;
  public status!: 'pending' | 'sent' | 'success' | 'failed' | 'timeout';
  public response!: any;
  public error_message!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CommandRecord.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    session_id: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    device_id: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    command_type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    command_payload: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'success', 'failed', 'timeout'),
      defaultValue: 'pending'
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    error_message: {
      type: DataTypes.STRING(512),
      allowNull: true,
      defaultValue: ''
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'command_records',
    timestamps: true,
    underscored: true
  }
);

export default CommandRecord;
