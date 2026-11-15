import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import {
  componentChunk,
  components,
  fieldControls,
  floatingControls,
} from "./components.mjs";

const names = components.map(({ name }) => name);

await mkdir("dist/styles/components", { recursive: true });
await copyFile("src/styles/tokens.css", "dist/tokens.css");

for (const name of [...names, "field", "floating"]) {
  await build({
    configFile: false,
    plugins: [tailwindcss()],
    build: {
      outDir: resolve("dist/styles/components"),
      emptyOutDir: false,
      assetsDir: "",
      rollupOptions: {
        input: resolve(`src/styles/components/${name}.css`),
        output: { assetFileNames: `${name}[extname]` },
      },
    },
  });
}

// Styles go on the chunk holding the component, not the pure re-export entry: Rolldown (Vite 8)
// and webpack skip side-effect-free re-export modules and would drop their CSS imports.
const owners = new Map();
for (const name of names) {
  const chunk = componentChunk(await readFile(`dist/${name}.js`, "utf8"), name);
  if (owners.has(chunk))
    throw new Error(
      `${name} and ${owners.get(chunk)} share ${chunk}; each needs its own chunk to carry only its styles.`,
    );
  owners.set(chunk, name);
  const entry = `dist/${chunk}`;
  const code = await readFile(entry, "utf8");
  // After the chunk's own imports, so the CSS of components it renders loads first and ours can override it.
  const [imports] = code.match(/^(?:import[^;]*;\n)*/);
  await writeFile(
    entry,
    `${imports}import './tokens.css';\n${fieldControls.has(name) ? "import './styles/components/field.css';\n" : ""}${floatingControls.has(name) ? "import './styles/components/floating.css';\n" : ""}import './styles/components/${name}.css';\n${code.slice(imports.length)}`,
  );
}

// Named, not `export *`: Next.js otherwise ships every component's CSS for any root import.
const rootExports = [];
for (const name of names) {
  const code = await readFile(`dist/${name}.js`, "utf8");
  const exported = [...code.matchAll(/export \{([^}]*)\}/g)].flatMap(
    ([, list]) =>
      list
        .split(",")
        .map((item) =>
          item
            .trim()
            .split(/\s+as\s+/)
            .pop(),
        )
        .filter(Boolean),
  );
  if (!exported.length) throw new Error(`dist/${name}.js exports nothing.`);
  rootExports.push(`export { ${exported.join(", ")} } from './${name}.js';`);
}
await writeFile("dist/index.js", rootExports.join("\n") + "\n");

// Next.js needs this first in every module that uses hooks; the root entry only re-exports them.
for (const file of await readdir("dist")) {
  if (file.endsWith(".js") && file !== "index.js") {
    const code = await readFile(`dist/${file}`, "utf8");
    await writeFile(`dist/${file}`, `"use client";\n${code}`);
  }
}

for (const file of await readdir("dist/styles/components")) {
  if (file.endsWith(".js")) await unlink(`dist/styles/components/${file}`);
}
