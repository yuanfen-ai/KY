console.log('DEBUG index.js: Module loaded');
console.log('DEBUG index.js: About to call startServer()');

const originalStartServer = require('./dist/index.js');

console.log('DEBUG index.js: startServer() returned');
