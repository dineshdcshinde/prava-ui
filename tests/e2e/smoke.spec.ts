import { expect, test } from '@playwright/test';

test('Storybook serves the foundation page', async ({ page }) => {
  await page.goto('/?path=/story/foundations-overview--overview');
  await expect(page.getByText('Prava UI foundations')).toBeVisible();
});
