import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('scaffold foundation', () => {
  it('defines namespaced tokens without a global reset', () => {
    const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
    expect(css).toContain('--prava-color-canvas');
    expect(css).not.toMatch(/\*\s*\{\s*box-sizing/);
  });
});
