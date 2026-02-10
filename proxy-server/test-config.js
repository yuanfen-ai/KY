const config = require('./dist/config');
console.log('Config:', JSON.stringify(config, null, 2));
console.log('Config.env:', config.config.env);
console.log('Config.log:', config.config.log);
