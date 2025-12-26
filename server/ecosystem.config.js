const os = require('os');
const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

module.exports = {
  apps: [
    {
      name: 'gridcore-service',
      script: './src/app.js',
      cwd: './service',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'gridcore-client',
      script: './start-client.js',
      cwd: './',
      autorestart: true,
      watch: false
    }
  ]
};
