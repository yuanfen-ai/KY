"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Device extends sequelize_1.Model {
}
exports.Device = Device;
Device.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    device_id: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false,
        unique: true
    },
    device_name: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: false
    },
    device_type: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false
    },
    tcp_host: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false
    },
    tcp_port: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('online', 'offline', 'error'),
        defaultValue: 'offline'
    },
    last_heartbeat: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: database_1.sequelize,
    tableName: 'devices',
    timestamps: true,
    underscored: true
});
exports.default = Device;
//# sourceMappingURL=device.js.map