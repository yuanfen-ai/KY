const logger = require('./dist/utils/logger');
console.log('Logger type:', typeof logger);
console.log('Logger:', logger);
console.log('Logger keys:', Object.keys(logger));
console.log('Logger.info:', logger.info);
console.log('Logger.default:', logger.default);

// Try with default
const logger2 = require('./dist/utils/logger').default;
console.log('Logger.default type:', typeof logger2);
console.log('Logger.default:', logger2);
console.log('Logger.default.info:', logger2 ? logger2.info : 'undefined');

if (logger2 && logger2.info) {
  console.log('Calling logger2.info...');
  logger2.info('Test message');
}
