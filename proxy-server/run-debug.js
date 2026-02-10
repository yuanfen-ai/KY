#!/usr/bin/env node

console.log('=== Starting Backend Server ===');
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment NODE_ENV:', process.env.NODE_ENV);

const dotenv = require('dotenv');
dotenv.config();

console.log('Database config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  name: process.env.DB_NAME,
  user: process.env.DB_USER
});

try {
  console.log('About to require index.js...');
  require('./dist/index.js');
  console.log('index.js required successfully');
} catch (error) {
  console.error('Error requiring index.js:', error);
  process.exit(1);
}
