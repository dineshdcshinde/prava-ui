import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const output = execFileSync(npm, ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const [pack] = JSON.parse(output);
if (!pack.files.some(({ path }) => path === 'dist/index.js')) {
  throw new Error('Built package is missing dist/index.js. Run npm run build first.');
}
if (!pack.files.some(({ path }) => path === 'dist/styles.css')) {
  throw new Error('Built package is missing dist/styles.css. Run npm run build first.');
}
if (!pack.files.some(({ path }) => path === 'dist/styles/components/button.css')) {
  throw new Error('Built package is missing the granular Button stylesheet. Run npm run build first.');
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.peerDependencies.react !== '>=18.2.0 <20.0.0') {
  throw new Error('React peer dependency range does not match the PRD.');
}
console.log(`Package dry run passed (${pack.entryCount} files, ${pack.unpackedSize} bytes).`);
