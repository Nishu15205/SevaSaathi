import { spawn } from 'child_process';

const child = spawn('bun', ['run', 'dev'], {
  cwd: '/home/z/my-project',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=640' },
  detached: true,
  stdio: 'ignore'
});

child.unref();
console.log(`Started dev server with PID ${child.pid}`);
