import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const components = ['button', 'badge', 'avatar', 'spinner'];
await mkdir('dist/styles/components', { recursive: true });
await copyFile('src/styles/tokens.css', 'dist/tokens.css');

for (const name of components) {
  await build({
    configFile: false,
    plugins: [tailwindcss()],
    build: {
      outDir: resolve('dist/styles/components'),
      emptyOutDir: false,
      assetsDir: '',
      rollupOptions: {
        input: resolve(`src/styles/components/${name}.css`),
        output: { assetFileNames: `${name}[extname]` },
      },
    },
  });
}

for (const name of components) {
  const entry = `dist/${name}.js`;
  const code = await readFile(entry, 'utf8');
  await writeFile(entry, `import './tokens.css';\nimport './styles/components/${name}.css';\n${code}`);
}

await writeFile('dist/index.js', components.map((name) => `export * from './${name}.js';`).join('\n') + '\n');

for (const file of await readdir('dist/styles/components')) {
  if (file.endsWith('.js')) await unlink(`dist/styles/components/${file}`);
}
