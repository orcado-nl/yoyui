import { spawnSync } from 'node:child_process';
import process from 'node:process';

const image = 'mcr.microsoft.com/playwright:v1.61.1-noble';
const updateSnapshots = process.argv.includes('--update-snapshots');
const testCommand = `CI=1 npx playwright test${updateSnapshots ? ' --update-snapshots' : ''}`;
const command = ['npm ci', 'npm run apidoc', 'npm run build', testCommand].join(' && ');
const result = spawnSync('docker', ['run', '--rm', '--ipc=host', '-v', `${process.cwd()}:/work`, '-v', 'yoyui-playwright-node-modules:/work/node_modules', '-w', '/work', image, 'bash', '-lc', command], {
    stdio: 'inherit'
});

if (result.error) {
    throw result.error;
}

process.exitCode = result.status ?? 1;
