import { expect, test } from '@playwright/test';

test('Storybook serves the foundation page', async ({ page }) => {
  await page.goto('/iframe.html?id=foundations-overview--overview&viewMode=story');
  await expect(page.getByText('Prava UI foundations')).toBeVisible();
});
