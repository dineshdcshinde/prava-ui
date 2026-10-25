import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await copyFile('src/styles/tokens.css', 'dist/tokens.css');
await mkdir('dist/styles/components', { recursive: true });
await copyFile('src/styles/components/button.css', 'dist/styles/components/button.css');
