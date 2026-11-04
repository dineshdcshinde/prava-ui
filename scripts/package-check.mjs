import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { build } from "vite";
import { components, fieldControls, floatingControls } from "./components.mjs";

const npmCommand = process.platform === "win32" ? process.execPath : "npm";
const npmPrefixArgs =
  process.platform === "win32" ? [process.env.npm_execpath] : [];
if (process.platform === "win32" && npmPrefixArgs[0] === undefined) {
  throw new Error("Run this check through npm so npm can locate its CLI.");
}
// `npm publish --dry-run` passes its flag down, which would stop this check packing a real tarball.
const env = { ...process.env };
delete env.npm_config_dry_run;
const runNpm = (args, options) =>
  execFileSync(npmCommand, [...npmPrefixArgs, ...args], { env, ...options });
const output = runNpm(["pack", "--dry-run", "--json"], { encoding: "utf8" });
const [pack] = JSON.parse(output);
if (!pack.files.some(({ path }) => path === "dist/index.js")) {
  throw new Error(
    "Built package is missing dist/index.js. Run npm run build first.",
  );
}
if (!pack.files.some(({ path }) => path === "dist/styles.css")) {
  throw new Error(
    "Built package is missing dist/styles.css. Run npm run build first.",
  );
}
for (const path of ["dist/tokens.css"]) {
  if (!pack.files.some(({ path: packedPath }) => packedPath === path)) {
    throw new Error(
      `Built package is missing shared stylesheet ${path}. Run npm run build first.`,
    );
  }
}
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const rootEntry = await readFile("dist/index.js", "utf8");
for (const { name } of components) {
  const entry = `dist/${name}.js`;
  const stylesheet = `dist/styles/components/${name}.css`;
  if (
    !pack.files.some(({ path }) => path === entry) ||
    !pack.files.some(({ path }) => path === stylesheet)
  ) {
    throw new Error(
      `Built package is missing the automatic ${name} JavaScript or CSS entry. Run npm run build first.`,
    );
  }
  const js = await readFile(entry, "utf8");
  if (!js.startsWith('"use client";'))
    throw new Error(
      `The ${name} entry must start with "use client" for Next.js.`,
    );
  if (
    !js.includes(`import './tokens.css';`) ||
    !js.includes(`import './styles/components/${name}.css';`) ||
    (fieldControls.has(name) &&
      !js.includes(`import './styles/components/field.css';`)) ||
    (floatingControls.has(name) &&
      !js.includes(`import './styles/components/floating.css';`))
  ) {
    throw new Error(
      `The ${name} JavaScript entry does not automatically import its stylesheets.`,
    );
  }
  if (
    !manifest.exports[`./${name}`] ||
    !manifest.exports["./styles/components/*"]
  ) {
    throw new Error(`Package exports are missing the ${name} entry points.`);
  }
  if (!rootEntry.includes(`export * from './${name}.js';`)) {
    throw new Error(
      `The package root entry is missing ${name} exports with automatic styles.`,
    );
  }
}
// The registry can't vouch for itself: every path package.json promises must really ship.
for (const [subpath, target] of Object.entries(manifest.exports)) {
  const paths = typeof target === "string" ? [target] : Object.values(target);
  for (const path of paths) {
    if (path.includes("*") || path === "./package.json") continue;
    if (!pack.files.some((file) => file.path === path.slice(2)))
      throw new Error(
        `The ${subpath} export points to ${path}, which is not packed.`,
      );
  }
}
if (manifest.peerDependencies.react !== ">=18.2.0 <20.0.0") {
  throw new Error("React peer dependency range does not match the PRD.");
}

const fixture = await mkdtemp(join(tmpdir(), "prava-ui-consumer-"));
try {
  const consumer = resolve(fixture, "consumer");
  const output = resolve(consumer, "out");
  const packed = JSON.parse(
    runNpm(["pack", "--pack-destination", fixture, "--json"], {
      encoding: "utf8",
    }),
  )[0];
  await mkdir(consumer, { recursive: true });
  runNpm(
    [
      "install",
      join(fixture, packed.filename),
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--legacy-peer-deps",
    ],
    {
      cwd: consumer,
      stdio: "ignore",
    },
  );
  const cssFiles = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    return (
      await Promise.all(
        entries.map((entry) => {
          const path = join(directory, entry.name);
          return entry.isDirectory()
            ? cssFiles(path)
            : entry.name.endsWith(".css")
              ? [path]
              : [];
        }),
      )
    ).flat();
  };

  const builds = components.flatMap(({ name, component }) => [
    {
      out: name,
      code: `import * as m from 'prava-ui/${name}'; console.log(m);`,
    },
    {
      out: `root-${name}`,
      code: `import { ${component} } from 'prava-ui'; console.log(${component});`,
    },
  ]);
  for (const { out, code } of builds) {
    const input = resolve(consumer, `${out}.js`);
    await writeFile(input, code);
    await build({
      configFile: false,
      root: consumer,
      logLevel: "warn",
      build: {
        outDir: resolve(output, out),
        emptyOutDir: true,
        rollupOptions: {
          input,
          // Our entries start with "use client" for Next.js, which plain Rollup reports and ignores.
          onwarn(warning, warn) {
            if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
          },
          external: ["react", "react-dom", "react/jsx-runtime"],
        },
      },
    });
  }

  const readCss = async (directory) =>
    (
      await Promise.all(
        (await cssFiles(directory)).map((path) => readFile(path, "utf8")),
      )
    ).join("\n");
  const hasSelector = (css, name) =>
    new RegExp(`\\.prava-${name}[\\s{.:,[>+~]`).test(css);
  // Each entry, direct or through the root, must ship its own styles and no unrelated component's.
  for (const { name, component } of components) {
    const other = name === "button" ? ".prava-badge{" : ".prava-button{";
    for (const out of [name, `root-${name}`]) {
      const css = await readCss(resolve(output, out));
      if (!hasSelector(css, name) || css.includes(other))
        throw new Error(
          `The ${out} consumer build did not select only ${component} styles.`,
        );
      if (fieldControls.has(name) && !css.includes(".prava-field__error{"))
        throw new Error(`The ${out} consumer build is missing field styles.`);
      if (floatingControls.has(name) && !css.includes(".prava-floating{"))
        throw new Error(
          `The ${out} consumer build is missing floating styles.`,
        );
    }
  }
  const aggregateCss = await readFile("dist/styles.css", "utf8");
  for (const { name } of [
    ...components,
    { name: "field__error" },
    { name: "floating" },
  ]) {
    if (!hasSelector(aggregateCss, name))
      throw new Error(`The aggregate stylesheet is missing .prava-${name}.`);
  }
  // Global selectors would restyle the consumer's page; only Tailwind's --tw-* fallback block is exempt.
  const withoutFallback = aggregateCss.replace(
    /@layer properties\{.*?\}\}\}/s,
    "",
  );
  const leaked = Array.from(withoutFallback.matchAll(/([^{}]+)\{/g), ([, s]) =>
    s.trim(),
  )
    .filter((s) => !s.startsWith("@"))
    .flatMap((s) => s.split(/,(?![^(]*\))/))
    .filter((s) => !/prava|^:root$|^(from|to|[\d.]+%)$/.test(s.trim()));
  if (leaked.length) {
    throw new Error(
      `The aggregate stylesheet has unscoped selectors: ${[...new Set(leaked)].join(", ")}`,
    );
  }
} finally {
  const tempRoot = resolve(tmpdir());
  const cleanupTarget = resolve(fixture);
  if (!cleanupTarget.startsWith(`${tempRoot}${sep}`))
    throw new Error(
      "Refusing to remove a path outside the temporary directory.",
    );
  await rm(cleanupTarget, { recursive: true, force: true });
}
console.log(
  `Package contents and packed consumer CSS imports passed (${pack.entryCount} files, ${pack.unpackedSize} bytes).`,
);
