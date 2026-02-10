"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const { format, transports } = winston_1.default;
const logDir = config_1.config.log.filePath;
// 自定义格式
const customFormat = format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.errors({ stack: true }), format.splat(), format.json());
// 控制台格式
const consoleFormat = format.combine(format.colorize(), format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
const logger = winston_1.default.createLogger({
    level: config_1.config.log.level.toLowerCase(),
    format: customFormat,
    transports: [
        // 错误日志
        new transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        }),
        // 组合日志
        new transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ]
});
// 开发环境添加控制台输出
if (config_1.config.env !== 'production') {
    logger.add(new transports.Console({
        format: consoleFormat
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map