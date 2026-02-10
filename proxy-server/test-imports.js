const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

console.log('Node.js version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Environment variables loaded:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_NAME:', process.env.DB_NAME);

try {
  console.log('\n1. Testing config import...');
  const config = require('./dist/config');
  console.log('✓ Config loaded:', JSON.stringify(config, null, 2));

  console.log('\n2. Testing database import...');
  const database = require('./dist/config/database');
  console.log('✓ Database module loaded');

  console.log('\n3. Testing logger import...');
  const logger = require('./dist/utils/logger');
  console.log('✓ Logger loaded');
  logger.info('Test log message');

  console.log('\n4. All imports successful!');
} catch (error) {
  console.error('\n✗ Import failed:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
