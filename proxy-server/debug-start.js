console.log('DEBUG: Script started');

try {
  console.log('DEBUG: Before dotenv');
  const dotenv = require('dotenv');
  console.log('DEBUG: dotenv loaded');
  
  dotenv.config();
  console.log('DEBUG: dotenv.config() called');
  
  console.log('DEBUG: NODE_ENV =', process.env.NODE_ENV);
  
  console.log('DEBUG: Before require dist/index.js');
  require('./dist/index.js');
  console.log('DEBUG: After require dist/index.js');
  
} catch (error) {
  console.error('DEBUG ERROR:', error);
  console.error('DEBUG ERROR message:', error.message);
  console.error('DEBUG ERROR stack:', error.stack);
}

console.log('DEBUG: Script ended');
