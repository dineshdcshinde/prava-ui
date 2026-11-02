import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// V2 guarantee: a file that redefines the semantic tokens replaces every color Prava paints.
const source = readFileSync('src/styles/tokens.css', 'utf8');
const names = (pattern: RegExp) => [
  ...new Set(Array.from(source.matchAll(pattern), ([, name]) => name!)),
];
const colors = names(/(--prava-color-(?!scheme)[\w-]+):/g);
const shadows = names(/(--prava-shadow-[\w-]+):/g);
const palette = colors.map(
  (_, i) => `rgb(${200 + (i % 50)}, ${10 + i}, ${100 + i})`,
);
const theme = `:root, [data-prava-theme] {
  ${colors.map((name, i) => `${name}: ${palette[i]};`).join('\n')}
  ${shadows.map((name) => `${name}: 0 0 0 1px ${palette[0]};`).join('\n')}
}`;

for (const id of ['overview--light', 'overview--dark', 'overview--rtl']) {
  test(`a full token swap leaves no default color in ${id}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await page.locator('.prava-card').first().waitFor();
    await page.addStyleTag({
      content: `${theme} * { transition: none !important; }`,
    });

    const painted = await page.evaluate(() => {
      const found: string[] = [];
      for (const el of [document.body, ...document.body.querySelectorAll('*')]) {
        if (!el.getClientRects().length) continue;
        const s = getComputedStyle(el);
        if (s.opacity === '0') continue;
        const label = `${el.tagName}.${el.getAttribute('class')}`;
        found.push(`${s.color}|${label}`, `${s.backgroundColor}|${label}`);
        const after = getComputedStyle(el, '::after');
        if (after.content !== 'none')
          found.push(`${after.backgroundColor}|${label}::after`);
        if (parseFloat(s.borderTopWidth) > 0)
          found.push(`${s.borderTopColor}|${label}`);
        for (const c of s.boxShadow.match(/rgba?\([^)]+\)/g) ?? [])
          found.push(`${c}|${label} shadow`);
      }
      return found;
    });
    const allowed = new Set([...palette, 'rgba(0, 0, 0, 0)']);
    const leftovers = [
      ...new Set(painted.filter((p) => !allowed.has(p.split('|')[0]!))),
    ];
    expect(painted.length).toBeGreaterThan(50);
    expect(leftovers).toEqual([]);
  });
}

test('theme="system" resets inside a dark subtree', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/iframe.html?id=overview--dark&viewMode=story');
  await page.locator('.prava-card').first().waitFor();
  const [dark, system, scheme] = await page.evaluate(() => {
    const outer = document.createElement('div');
    outer.setAttribute('data-prava-theme', 'dark');
    const inner = document.createElement('div');
    inner.setAttribute('data-prava-theme', 'system');
    outer.append(inner);
    document.body.append(outer);
    const read = (el: Element, name: string) =>
      getComputedStyle(el).getPropertyValue(name).trim();
    return [
      read(outer, '--prava-color-surface'),
      read(inner, '--prava-color-surface'),
      read(inner, '--prava-color-scheme'),
    ];
  });
  expect(system).not.toBe(dark);
  expect(scheme).toBe('light');
});
