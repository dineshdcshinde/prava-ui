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
import { createRequire } from "node:module";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { build } from "vite";
import { rolldown } from "rolldown";
import webpack from "webpack";
import {
  componentChunk,
  components,
  fieldControls,
  floatingControls,
} from "./components.mjs";

const require = createRequire(import.meta.url);
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
const devOnly = pack.files.filter(({ path }) =>
  /\.(test|spec|stories)\.|Story\.|^dist\/test\//.test(path),
);
if (devOnly.length) {
  throw new Error(
    `The package ships test or story files: ${devOnly.map(({ path }) => path).join(", ")}`,
  );
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
  const chunk = await readFile(`dist/${componentChunk(js, name)}`, "utf8");
  if (
    !chunk.includes(`import './tokens.css';`) ||
    !chunk.includes(`import './styles/components/${name}.css';`) ||
    (fieldControls.has(name) &&
      !chunk.includes(`import './styles/components/field.css';`)) ||
    (floatingControls.has(name) &&
      !chunk.includes(`import './styles/components/floating.css';`))
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
  if (!rootEntry.includes(` } from './${name}.js';`)) {
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
      code: `import * as m from '${manifest.name}/${name}'; console.log(m);`,
    },
    {
      out: `root-${name}`,
      code: `import { ${component} } from '${manifest.name}'; console.log(${component});`,
    },
  ]);
  const external = ["react", "react-dom", "react/jsx-runtime"];
  const viteBuild = (build) => (input, outDir) =>
    build({
      configFile: false,
      root: consumer,
      logLevel: "warn",
      build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
          input,
          // Our entries start with "use client" for Next.js, which plain Rollup reports and ignores.
          onwarn(warning, warn) {
            if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
          },
          external,
        },
      },
    });
  // Vite 8 (Rolldown) and webpack skip side-effect-free re-export modules, unlike Vite 7 (Rollup).
  const bundlers = {
    vite7: viteBuild(build),
    // Like Vite 8's dependency pre-bundler: CSS stays an external import, so copy what survives.
    async rolldown(input, dir) {
      const bundle = await rolldown({
        input,
        cwd: consumer,
        external: (id) => external.includes(id) || id.endsWith(".css"),
        onwarn(warning, warn) {
          if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
        },
      });
      const { output: chunks } = await bundle.write({ dir });
      const kept = chunks.flatMap((chunk) => chunk.imports ?? []);
      await Promise.all(
        kept
          .filter((id) => id.endsWith(".css"))
          .map(async (id, index) =>
            writeFile(
              join(dir, `${index}.css`),
              await readFile(resolve(consumer, id), "utf8"),
            ),
          ),
      );
    },
    webpack: (entry, path) =>
      new Promise((done, fail) =>
        webpack(
          {
            mode: "production",
            context: consumer,
            entry,
            output: { path },
            externals: external,
            plugins: [new MiniCssExtractPlugin()],
            module: {
              rules: [
                {
                  test: /\.css$/,
                  use: [
                    MiniCssExtractPlugin.loader,
                    require.resolve("css-loader"),
                  ],
                },
              ],
            },
          },
          (error, stats) =>
            error || stats.hasErrors()
              ? fail(error ?? new Error(stats.toString("errors-only")))
              : done(),
        ),
      ),
  };
  for (const { out, code } of builds) {
    const input = resolve(consumer, `${out}.js`);
    await writeFile(input, code);
    await Promise.all(
      Object.entries(bundlers).map(([bundler, bundle]) =>
        bundle(input, resolve(output, bundler, out)),
      ),
    );
  }

  // A component may ship the styles of components its chunk imports (Toast renders Alert), no others.
  const owners = new Map();
  for (const { name } of components)
    owners.set(
      componentChunk(await readFile(`dist/${name}.js`, "utf8"), name),
      name,
    );
  const rendered = async (chunk, seen = new Set()) => {
    if (seen.has(chunk)) return seen;
    seen.add(chunk);
    const code = await readFile(`dist/${chunk}`, "utf8");
    for (const [, next] of code.matchAll(/from "\.\/([^"]+\.js)"/g))
      await rendered(next, seen);
    return seen;
  };

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
    const chunk = componentChunk(
      await readFile(`dist/${name}.js`, "utf8"),
      name,
    );
    const allowed = new Set(
      [...(await rendered(chunk))].map((file) => owners.get(file)),
    );
    const foreign = components
      .map((other) => other.name)
      .filter((other) => !allowed.has(other));
    for (const out of Object.keys(bundlers).flatMap((bundler) => [
      `${bundler}/${name}`,
      `${bundler}/root-${name}`,
    ])) {
      const css = await readCss(resolve(output, out));
      const extra = foreign.filter((other) => hasSelector(css, other));
      if (!hasSelector(css, name) || extra.length)
        throw new Error(
          `The ${out} consumer build did not select only ${component} styles${extra.length ? `; it also has ${extra.join(", ")}` : ""}.`,
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
