import { expect, test } from "@playwright/test";

test("Input floats its label from the real value and fits a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/iframe.html?id=forms-input--default&viewMode=story");

  const input = page.getByRole("textbox", { name: "Email address" });
  const label = page.locator(".prava-input__label");
  await expect(input).toBeVisible();
  await expect(label).not.toHaveCSS("top", "0px");
  expect((await input.boundingBox())?.width).toBeLessThanOrEqual(320);

  await input.click();
  await expect(label).toHaveCSS("top", "0px");
  await input.blur();
  await expect(label).not.toHaveCSS("top", "0px");

  // Set through the ref, as react-hook-form's reset and browser autofill do.
  await input.evaluate((el) => {
    (el as HTMLInputElement).value = "person@example.com";
  });
  await expect(label).toHaveCSS("top", "0px");
});
