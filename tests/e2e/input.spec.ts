import { expect, test } from "@playwright/test";

test("Input floats its label and fits a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/?path=/story/components-input--default");

  const input = page.getByRole("textbox", { name: "Email address" });
  await expect(input).toBeVisible();
  await expect(input).not.toHaveAttribute("data-floated", "true");
  const bounds = await input.boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(320);

  await input.click();
  await expect(input).toHaveAttribute("data-floated", "true");
  await input.fill("person@example.com");
  await input.evaluate((element) => (element as HTMLInputElement).blur());
  await expect(input).toHaveAttribute("data-floated", "true");
});
