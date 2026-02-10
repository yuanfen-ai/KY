const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

try {
  console.log('Starting KY Proxy Server...');
  console.log('Environment:', process.env.NODE_ENV);
  
  // 尝试导入并启动
  require('./dist/index.js');
  
} catch (error) {
  console.error('Failed to start server:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
