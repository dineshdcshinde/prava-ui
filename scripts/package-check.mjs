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

const npmCommand = process.platform === "win32" ? process.execPath : "npm";
const npmPrefixArgs =
  process.platform === "win32" ? [process.env.npm_execpath] : [];
if (process.platform === "win32" && npmPrefixArgs[0] === undefined) {
  throw new Error("Run this check through npm so npm can locate its CLI.");
}
const runNpm = (args, options) =>
  execFileSync(npmCommand, [...npmPrefixArgs, ...args], options);
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
if (
  !pack.files.some(({ path }) => path === "dist/styles/components/button.css")
) {
  throw new Error(
    "Built package is missing the granular Button stylesheet. Run npm run build first.",
  );
}
for (const name of [
  "button",
  "badge",
  "avatar",
  "spinner",
  "input",
  "card",
  "separator",
  "skeleton",
  "progress",
  "textarea",
  "label",
  "form-field",
]) {
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
  if (
    !js.includes(`import './tokens.css';`) ||
    !js.includes(`import './styles/components/${name}.css';`)
  ) {
    throw new Error(
      `The ${name} JavaScript entry does not automatically import its stylesheet.`,
    );
  }
}
const manifest = JSON.parse(await readFile("package.json", "utf8"));
if (
  !manifest.exports["./button"] ||
  !manifest.exports["./badge"] ||
  !manifest.exports["./avatar"] ||
  !manifest.exports["./spinner"] ||
  !manifest.exports["./input"] ||
  !manifest.exports["./card"] ||
  !manifest.exports["./separator"] ||
  !manifest.exports["./skeleton"] ||
  !manifest.exports["./progress"] ||
  !manifest.exports["./textarea"] ||
  !manifest.exports["./label"] ||
  !manifest.exports["./form-field"]
) {
  throw new Error(
    "Package exports are missing automatic component entry points.",
  );
}
const rootEntry = await readFile("dist/index.js", "utf8");
if (
  ![
    "button",
    "badge",
    "avatar",
    "spinner",
    "input",
    "card",
    "separator",
    "skeleton",
    "progress",
    "textarea",
    "label",
    "form-field",
  ].every((name) => rootEntry.includes(`export * from './${name}.js';`))
) {
  throw new Error(
    "The package root entry is missing component exports with automatic styles.",
  );
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

  for (const [name, specifier] of [
    ["button", "prava-ui/button"],
    ["badge", "prava-ui/badge"],
    ["avatar", "prava-ui/avatar"],
    ["spinner", "prava-ui/spinner"],
    ["input", "prava-ui/input"],
    ["card", "prava-ui/card"],
    ["separator", "prava-ui/separator"],
    ["skeleton", "prava-ui/skeleton"],
    ["progress", "prava-ui/progress"],
    ["textarea", "prava-ui/textarea"],
    ["label", "prava-ui/label"],
    ["form-field", "prava-ui/form-field"],
    ["root", "prava-ui"],
    ["root-badge", "prava-ui"],
    ["root-spinner", "prava-ui"],
    ["root-input", "prava-ui"],
    ["root-card", "prava-ui"],
    ["root-separator", "prava-ui"],
    ["root-skeleton", "prava-ui"],
    ["root-progress", "prava-ui"],
    ["root-textarea", "prava-ui"],
    ["root-label", "prava-ui"],
    ["root-form-field", "prava-ui"],
  ]) {
    const input = resolve(consumer, `${name}.js`);
    const rootComponent = {
      root: "Button",
      "root-badge": "Badge",
      "root-spinner": "Spinner",
      "root-input": "Input",
      "root-card": "Card",
      "root-separator": "Separator",
      "root-skeleton": "Skeleton",
      "root-progress": "Progress",
      "root-textarea": "Textarea",
      "root-label": "Label",
      "root-form-field": "FormField",
    }[name];
    const imported = rootComponent
      ? `import { ${rootComponent} }`
      : "import * as library";
    const used = rootComponent
      ? `console.log(${rootComponent});`
      : "console.log(library);";
    await writeFile(input, `${imported} from '${specifier}'; ${used}`);
    await build({
      configFile: false,
      root: consumer,
      build: {
        outDir: resolve(output, name),
        emptyOutDir: true,
        rollupOptions: {
          input,
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
  const buttonCss = await readCss(resolve(output, "button"));
  const badgeCss = await readCss(resolve(output, "badge"));
  const rootButtonCss = await readCss(resolve(output, "root"));
  const rootBadgeCss = await readCss(resolve(output, "root-badge"));
  const spinnerCss = await readCss(resolve(output, "spinner"));
  const rootSpinnerCss = await readCss(resolve(output, "root-spinner"));
  const inputCss = await readCss(resolve(output, "input"));
  const rootInputCss = await readCss(resolve(output, "root-input"));
  const cardCss = await readCss(resolve(output, "card"));
  const rootCardCss = await readCss(resolve(output, "root-card"));
  const separatorCss = await readCss(resolve(output, "separator"));
  const rootSeparatorCss = await readCss(resolve(output, "root-separator"));
  const skeletonCss = await readCss(resolve(output, "skeleton"));
  const rootSkeletonCss = await readCss(resolve(output, "root-skeleton"));
  const progressCss = await readCss(resolve(output, "progress"));
  const rootProgressCss = await readCss(resolve(output, "root-progress"));
  const textareaCss = await readCss(resolve(output, "textarea"));
  const rootTextareaCss = await readCss(resolve(output, "root-textarea"));
  const labelCss = await readCss(resolve(output, "label"));
  const rootLabelCss = await readCss(resolve(output, "root-label"));
  const formFieldCss = await readCss(resolve(output, "form-field"));
  const rootFormFieldCss = await readCss(resolve(output, "root-form-field"));
  const aggregateCss = await readFile("dist/styles.css", "utf8");
  if (
    !buttonCss.includes(".prava-button{") ||
    buttonCss.includes(".prava-badge{")
  ) {
    throw new Error(
      "A Button-only consumer build did not select only Button styles.",
    );
  }
  if (
    !badgeCss.includes(".prava-badge{") ||
    badgeCss.includes(".prava-button{")
  ) {
    throw new Error(
      "A Badge-only consumer build did not select only Badge styles.",
    );
  }
  if (
    !rootButtonCss.includes(".prava-button{") ||
    rootButtonCss.includes(".prava-badge{")
  ) {
    throw new Error(
      "A root Button-only consumer build did not tree-shake to Button styles.",
    );
  }
  if (
    !rootBadgeCss.includes(".prava-badge{") ||
    rootBadgeCss.includes(".prava-button{")
  ) {
    throw new Error(
      "A root Badge-only consumer build did not tree-shake to Badge styles.",
    );
  }
  if (
    !spinnerCss.includes(".prava-spinner{") ||
    spinnerCss.includes(".prava-badge{")
  ) {
    throw new Error(
      "A Spinner-only consumer build did not select only Spinner styles.",
    );
  }
  if (
    !rootSpinnerCss.includes(".prava-spinner{") ||
    rootSpinnerCss.includes(".prava-badge{")
  ) {
    throw new Error(
      "A root Spinner-only consumer build did not tree-shake to Spinner styles.",
    );
  }
  if (
    !inputCss.includes(".prava-input{") ||
    inputCss.includes(".prava-button{")
  ) {
    throw new Error(
      "An Input-only consumer build did not select only Input styles.",
    );
  }
  if (
    !rootInputCss.includes(".prava-input{") ||
    rootInputCss.includes(".prava-button{")
  ) {
    throw new Error(
      "A root Input-only consumer build did not tree-shake to Input styles.",
    );
  }
  if (!cardCss.includes(".prava-card{") || cardCss.includes(".prava-button{")) {
    throw new Error(
      "A Card-only consumer build did not select only Card styles.",
    );
  }
  if (
    !rootCardCss.includes(".prava-card{") ||
    rootCardCss.includes(".prava-button{")
  ) {
    throw new Error(
      "A root Card-only consumer build did not tree-shake to Card styles.",
    );
  }
  for (const [name, direct, root, selector] of [
    ["Separator", separatorCss, rootSeparatorCss, ".prava-separator"],
    ["Skeleton", skeletonCss, rootSkeletonCss, ".prava-skeleton"],
    ["Progress", progressCss, rootProgressCss, ".prava-progress"],
    ["Textarea", textareaCss, rootTextareaCss, ".prava-textarea"],
    ["Label", labelCss, rootLabelCss, ".prava-label"],
    ["FormField", formFieldCss, rootFormFieldCss, ".prava-form-field"],
  ]) {
    if (!direct.includes(`${selector}{`) || direct.includes(".prava-button{"))
      throw new Error(
        `A ${name}-only consumer build did not select only ${name} styles.`,
      );
    if (!root.includes(`${selector}{`) || root.includes(".prava-button{"))
      throw new Error(
        `A root ${name}-only consumer build did not tree-shake to ${name} styles.`,
      );
  }
  const hasRule = (selector) =>
    aggregateCss.includes(`${selector}{`) ||
    aggregateCss.includes(`${selector} {`);
  if (
    !hasRule(".prava-button") ||
    !hasRule(".prava-badge") ||
    !hasRule(".prava-avatar") ||
    !hasRule(".prava-spinner") ||
    !hasRule(".prava-input") ||
    !hasRule(".prava-card") ||
    !hasRule(".prava-separator") ||
    !hasRule(".prava-skeleton") ||
    !hasRule(".prava-progress") ||
    !hasRule(".prava-textarea") ||
    !hasRule(".prava-label") ||
    !hasRule(".prava-form-field")
  ) {
    throw new Error("The aggregate stylesheet is missing component styles.");
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
