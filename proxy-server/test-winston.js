const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

console.log('Winston version:', winston.version);
console.log('Logger level:', logger.level);
console.log('Logger transports:', logger.transports.length);

logger.info('Test winston message');
logger.error('Test winston error');
