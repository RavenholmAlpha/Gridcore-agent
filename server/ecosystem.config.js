const os = require('os');
const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
// On Windows (local dev), use 5173. On Linux (server), use 80 for Cloudflare Flexible SSL.
// Note: Binding to port 80 on Linux usually requires root privileges or authbind.
const clientPort = os.platform() === 'win32' ? 5173 : 80;

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
      watch: false,
      env: {
        PORT: clientPort
      }
    }
  ]
};
