const winston = require('winston');
const config = require('./dist/config');

console.log('Config log level:', config.config.log.level);
console.log('Config log env:', config.config.env);

console.log('Winston levels:', winston.levels);

const logger = require('./dist/utils/logger').default;
console.log('Logger level:', logger.level);

logger.info('Test with current config');

// Change level to lowercase
logger.level = 'info';
console.log('Logger level changed to:', logger.level);
logger.info('Test after changing level to lowercase');
