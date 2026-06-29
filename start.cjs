// start.cjs — Hostinger entry point: builds then starts the server
const { execSync, spawn } = require('child_process');
const path = require('path');

console.log('🔨 Building Olai Notes...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
}

console.log('🚀 Starting server...');
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname,
});

server.on('exit', (code) => process.exit(code));
