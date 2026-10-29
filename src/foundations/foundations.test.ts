import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokensPath = resolve(process.cwd(), 'src/styles/tokens.css');

describe('scaffold foundation', () => {
  it('defines namespaced tokens without a global reset', () => {
    const css = readFileSync(tokensPath, 'utf8');
    expect(css).toContain('--prava-color-canvas');
    expect(css).not.toMatch(/\*\s*\{\s*box-sizing/);
  });

  it('keeps text, actions, status labels, and focus contrast in both themes', () => {
    const css = readFileSync(tokensPath, 'utf8');
    const getTokens = (theme: 'light' | 'dark') => {
      const selector = theme === 'light' ? /:root\s*\{([^}]*)\}/ : /\[data-prava-theme='dark'\]\s*\{([^}]*)\}/;
      const block = css.match(selector)?.[1] ?? '';
      return Object.fromEntries(Array.from(block.matchAll(/--prava-color-([\w-]+):\s*(#[\da-f]{6})/gi), ([, name, value]) => [name, value])) as Record<string, string>;
    };
    const contrast = (foreground: string, background: string) => {
      const luminance = (hex: string) => {
        const channels = hex.match(/[\da-f]{2}/gi)!.map((channel) => parseInt(channel, 16) / 255);
        const [r, g, b] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0]! + 0.05) / (values[1]! + 0.05);
    };
    for (const theme of ['light', 'dark'] as const) {
      const tokens = getTokens(theme);
      expect(tokens.canvas).toBeDefined();
      expect(contrast(tokens.text!, tokens.surface!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens['text-muted']!, tokens.surface!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens['on-primary']!, tokens.primary!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens['on-primary-container']!, tokens['primary-container']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(tokens.focus!, tokens.canvas!)).toBeGreaterThanOrEqual(3);

      for (const [background, foreground] of [
        ['success', 'on-success'], ['warning', 'on-warning'], ['danger-container', 'on-danger-container'], ['info', 'on-info'],
      ]) {
        expect(contrast(tokens[foreground]!, tokens[background]!)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
