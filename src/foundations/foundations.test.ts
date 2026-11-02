import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "src/styles/tokens.css"),
  "utf8",
);
const componentsDir = resolve(process.cwd(), "src/styles/components");
const componentCss = readdirSync(componentsDir).map(
  (file) => [file, readFileSync(resolve(componentsDir, file), "utf8")] as const,
);

const block = (selector: RegExp) => css.match(selector)?.[1] ?? "";
const themeTokens = (body: string) =>
  Object.fromEntries(
    Array.from(
      body.matchAll(/--prava-((?:color|shadow)-[\w-]+):\s*([^;]+);/g),
      ([, name, value]) => [name, value.replace(/\s+/g, " ").trim()],
    ),
  ) as Record<string, string>;
const light = themeTokens(
  block(
    /:root,\s*\[data-prava-theme=["']light["']\],\s*\[data-prava-theme=["']system["']\]\s*\{([^}]*)\}/,
  ),
);
const dark = themeTokens(
  block(/\n  \[data-prava-theme=["']dark["']\]\s*\{([^}]*)\}/),
);
const system = themeTokens(
  block(
    /color-scheme: dark\)\s*\{\s*\[data-prava-theme=["']system["']\]\s*\{([^}]*)\}/,
  ),
);

const contrast = (foreground: string, background: string) => {
  const luminance = (hex: string) => {
    const [r, g, b] = hex.match(/[\da-f]{2}/gi)!.map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [high, low] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (high! + 0.05) / (low! + 0.05);
};

describe("foundation tokens", () => {
  it("defines namespaced tokens in a cascade layer without global resets or host color-scheme", () => {
    expect(css).toMatch(/^@layer prava\.tokens \{/m);
    expect(css).not.toMatch(/\*\s*\{/);
    expect(css).not.toMatch(/:root\s*\{[^}]*color-scheme/);
  });

  it("keeps system dark identical to the explicit dark theme", () => {
    expect(Object.keys(dark).length).toBeGreaterThan(0);
    expect(system).toEqual(dark);
  });

  it("defines every color and shadow token in both themes", () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it("meets WCAG AA contrast for text, actions, status pairs, focus and control borders", () => {
    for (const tokens of [light, dark]) {
      const c = (fg: string, bg: string) =>
        contrast(tokens[`color-${fg}`]!, tokens[`color-${bg}`]!);
      for (const bg of ["surface", "canvas", "surface-sunken"]) {
        expect(c("text", bg)).toBeGreaterThanOrEqual(4.5);
        expect(c("text-muted", bg)).toBeGreaterThanOrEqual(4.5);
      }
      expect(c("on-primary", "primary")).toBeGreaterThanOrEqual(4.5);
      expect(c("on-primary", "primary-hover")).toBeGreaterThanOrEqual(4.5);
      expect(
        c("on-primary-container", "primary-container"),
      ).toBeGreaterThanOrEqual(4.5);
      expect(c("on-danger", "danger")).toBeGreaterThanOrEqual(4.5);
      expect(c("danger", "surface")).toBeGreaterThanOrEqual(4.5);
      for (const [bg, fg] of [
        ["success", "on-success"],
        ["warning", "on-warning"],
        ["danger-container", "on-danger-container"],
        ["info", "on-info"],
      ]) {
        expect(c(fg!, bg!)).toBeGreaterThanOrEqual(4.5);
      }
      expect(c("focus", "canvas")).toBeGreaterThanOrEqual(3);
      expect(c("focus", "surface")).toBeGreaterThanOrEqual(3);
      expect(c("border-strong", "surface")).toBeGreaterThanOrEqual(3);
      expect(c("border-strong", "canvas")).toBeGreaterThanOrEqual(3);
      // Pairs components actually paint: neutral badge, hover rows, errors, active fills, switch thumb, progress.
      expect(c("text", "surface-raised")).toBeGreaterThanOrEqual(4.5);
      expect(c("text", "surface-hover")).toBeGreaterThanOrEqual(4.5);
      expect(c("danger", "canvas")).toBeGreaterThanOrEqual(4.5);
      expect(c("primary", "surface")).toBeGreaterThanOrEqual(4.5);
      expect(c("on-primary", "primary-active")).toBeGreaterThanOrEqual(4.5);
      expect(c("on-danger", "danger-hover")).toBeGreaterThanOrEqual(4.5);
      expect(c("text-muted", "surface-raised")).toBeGreaterThanOrEqual(3);
      expect(c("primary", "surface-raised")).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("theme contract", () => {
  it("keeps raw colors out of component stylesheets", () => {
    for (const [file, source] of componentCss) {
      expect(source, file).not.toMatch(
        /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/i,
      );
    }
  });

  it("only uses color and shadow tokens that both themes define", () => {
    for (const [file, source] of componentCss) {
      for (const [, name] of source.matchAll(
        /--prava-((?:color|shadow)-[\w-]+)/g,
      )) {
        expect(light[name!], `${file} uses --prava-${name}`).toBeDefined();
        expect(dark[name!], `${file} uses --prava-${name}`).toBeDefined();
      }
    }
  });

  it("only references --prava-* variables that are defined somewhere", () => {
    const defined = new Set(
      [css, ...componentCss.map(([, source]) => source)].flatMap((source) =>
        Array.from(source.matchAll(/(--prava-[\w-]+):/g), ([, name]) => name),
      ),
    );
    defined.add("--prava-progress-value"); // set inline by Progress
    for (const [file, source] of componentCss) {
      for (const [, name] of source.matchAll(/\((--prava-[\w-]+)/g)) {
        expect(defined.has(name!), `${file} uses undefined ${name}`).toBe(true);
      }
    }
  });

  it("wraps every component stylesheet in the prava.components layer", () => {
    for (const [file, source] of componentCss) {
      expect(source, file).toMatch(/@layer prava\.components \{/);
    }
  });
});
