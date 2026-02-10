console.log('Testing logger...');

try {
  const logger = require('./dist/utils/logger');
  console.log('Logger loaded:', typeof logger);
  console.log('Logger methods:', Object.keys(logger).filter(k => typeof logger[k] === 'function'));
  
  logger.info('Test info message');
  logger.error('Test error message');
  
  console.log('Logger calls completed');
  
  setTimeout(() => {
    console.log('Checking log files...');
    const fs = require('fs');
    const logDir = './logs';
    const files = fs.readdirSync(logDir);
    console.log('Files in logs:', files);
    
    files.forEach(file => {
      const stats = fs.statSync(`${logDir}/${file}`);
      console.log(`  ${file}: ${stats.size} bytes`);
      if (stats.size > 0) {
        const content = fs.readFileSync(`${logDir}/${file}`, 'utf8');
        console.log(`    Last line: ${content.split('\n').slice(-2)}`);
      }
    });
  }, 1000);
  
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}
