import { expect, test } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=feedback-emptystate--${name}&viewMode=story`;

test("EmptyState exposes its heading and reaches the action by keyboard", async ({
  page,
}) => {
  await page.goto(story("default"));
  await expect(
    page.getByRole("heading", { level: 3, name: "No invoices yet" }),
  ).toBeVisible();

  const button = page.getByRole("button", { name: "Add a payment method" });
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await expect(button).not.toHaveCSS("outline-style", "none");

  // Centered in its container.
  const root = await page.locator(".prava-empty-state").boundingBox();
  const box = await button.boundingBox();
  expect(
    Math.abs(box!.x + box!.width / 2 - (root!.x + root!.width / 2)),
  ).toBeLessThan(1);
});

test("EmptyState lays its actions out from the inline start in RTL", async ({
  page,
}) => {
  await page.goto(story("right-to-left"));
  await expect(page.locator(".prava-empty-state")).toBeVisible();
  expect(
    await page
      .locator(".prava-empty-state")
      .evaluate((el) => getComputedStyle(el).direction),
  ).toBe("rtl");
  const first = await page
    .getByRole("button", { name: "إضافة طريقة دفع" })
    .boundingBox();
  const second = await page
    .getByRole("button", { name: "معرفة المزيد" })
    .boundingBox();
  expect(first!.x).toBeGreaterThan(second!.x);
});

for (const name of [
  "default",
  "several-actions",
  "long-text-narrow",
  "right-to-left",
]) {
  test(`EmptyState ${name} does not overflow at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(story(name));
    await expect(page.locator(".prava-empty-state")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test("EmptyState follows the dark theme", async ({ page }) => {
  await page.goto(story("default"));
  const title = page.locator(".prava-empty-state__title");
  await expect(title).toBeVisible();
  const light = await title.evaluate((el) => getComputedStyle(el).color);
  await page.screenshot({
    path: `${process.env.TEMP}/prava-empty-state-light.png`,
  });

  await page.goto(`${story("default")}&globals=theme:dark`);
  await expect(page.locator("body")).toHaveAttribute(
    "data-prava-theme",
    "dark",
  );
  await expect(title).toBeVisible();
  await expect
    .poll(() => title.evaluate((el) => getComputedStyle(el).color))
    .not.toBe(light);
  await page.screenshot({
    path: `${process.env.TEMP}/prava-empty-state-dark.png`,
  });
});
