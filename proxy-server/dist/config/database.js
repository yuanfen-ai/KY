"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.connectDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const logger_1 = __importDefault(require("../utils/logger"));
exports.sequelize = new sequelize_1.Sequelize({
    database: index_1.config.database.name,
    username: index_1.config.database.user,
    password: index_1.config.database.password,
    host: index_1.config.database.host,
    port: index_1.config.database.port,
    dialect: 'mysql',
    logging: (msg) => logger_1.default.debug(msg),
    pool: {
        max: index_1.config.database.poolMax,
        min: index_1.config.database.poolMin,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
const connectDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.default.info('Database connection established successfully');
    }
    catch (error) {
        logger_1.default.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const closeDatabase = async () => {
    try {
        await exports.sequelize.close();
        logger_1.default.info('Database connection closed');
    }
    catch (error) {
        logger_1.default.error('Error closing database connection:', error);
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map