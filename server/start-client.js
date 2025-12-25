const { spawn } = require('child_process');
const path = require('path');

const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', 'dev'];
const cwd = path.join(__dirname, 'client');

console.log(`Starting frontend in ${cwd}...`);

const child = spawn(cmd, args, { 
  cwd, 
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' } 
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('error', (err) => {
  console.error('Failed to start frontend:', err);
});

child.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  process.exit(code);
});
