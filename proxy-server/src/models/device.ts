import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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

interface DeviceCreationAttributes extends Optional<DeviceAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Device extends Model<DeviceAttributes, DeviceCreationAttributes> implements DeviceAttributes {
  public id!: number;
  public device_id!: string;
  public device_name!: string;
  public device_type!: string;
  public tcp_host!: string;
  public tcp_port!: number;
  public status!: 'online' | 'offline' | 'error';
  public last_heartbeat!: Date | null;
  public metadata!: any;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    device_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    device_type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    tcp_host: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    tcp_port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'error'),
      defaultValue: 'offline'
    },
    last_heartbeat: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
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
    tableName: 'devices',
    timestamps: true,
    underscored: true
  }
);

export default Device;
