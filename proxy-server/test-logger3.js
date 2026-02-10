const dotenv = require('dotenv');
dotenv.config();

console.log('Environment:', process.env.NODE_ENV);

const logger = require('./dist/utils/logger').default;
console.log('Logger loaded, type:', typeof logger);
console.log('Logger has info:', typeof logger.info);

logger.info('Test message from direct import');
logger.error('Test error message');

console.log('Done');
