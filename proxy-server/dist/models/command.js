"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRecord = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class CommandRecord extends sequelize_1.Model {
}
exports.CommandRecord = CommandRecord;
CommandRecord.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    session_id: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false
    },
    device_id: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false
    },
    command_type: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false
    },
    command_payload: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'sent', 'success', 'failed', 'timeout'),
        defaultValue: 'pending'
    },
    response: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    error_message: {
        type: sequelize_1.DataTypes.STRING(512),
        allowNull: true,
        defaultValue: ''
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
    tableName: 'command_records',
    timestamps: true,
    underscored: true
});
exports.default = CommandRecord;
//# sourceMappingURL=command.js.map