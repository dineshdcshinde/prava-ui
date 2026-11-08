import { expect, test, type Page } from "@playwright/test";

const visit = async (page: Page, story: string, query = "") => {
  await page.goto(
    `/iframe.html?id=display-tag--${story}&viewMode=story${query}`,
  );
  await page.locator(".prava-tag").first().waitFor();
};
const expectNoOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

test("selecting by keyboard shows state beyond color and moves nothing", async ({
  page,
}) => {
  await visit(page, "selectable-and-removable");
  const toggle = page.getByRole("button", { name: "Design", exact: true });
  const tag = page.locator(".prava-tag");
  const check = page.locator(".prava-tag__check svg");
  // A late web font swap would otherwise read as a geometry shift.
  await page.evaluate(() => document.fonts.ready);
  const before = await tag.boundingBox();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(check).toHaveCSS("opacity", "1");

  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(check).toHaveCSS("opacity", "0");
  expect(await tag.boundingBox()).toEqual(before);

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Remove Design" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tag).toHaveCount(0);
});

test("removing keeps the keyboard user's place through consumer focus", async ({
  page,
}) => {
  await visit(page, "removable");
  await page.getByRole("button", { name: "Remove Research" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Research")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Topics" })).toBeFocused();
});

test("remove is at least 24px on a fine pointer", async ({ page }) => {
  await visit(page, "sizes");
  for (const remove of await page.locator(".prava-tag__remove").all()) {
    const box = (await remove.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }
});

test("provider direction mirrors the controls in RTL", async ({ page }) => {
  await visit(page, "rtl");
  const remove = (await page
    .getByRole("button", { name: "إزالة كتابة" })
    .boundingBox())!;
  const toggle = (await page
    .getByRole("button", { name: "كتابة", exact: true })
    .boundingBox())!;
  expect(remove.x + remove.width).toBeLessThanOrEqual(toggle.x + 0.5);
  await expectNoOverflow(page);
});

for (const story of ["default", "tones", "selectable", "long-text", "rtl"]) {
  test(`${story} fits a 320px viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await visit(page, story);
    await expectNoOverflow(page);
  });
}

test("a long label truncates inside its container", async ({ page }) => {
  await visit(page, "long-text");
  const tag = (await page.locator(".prava-tag").boundingBox())!;
  const remove = (await page.locator(".prava-tag__remove").boundingBox())!;
  expect(tag.width).toBeLessThanOrEqual(192);
  expect(remove.x + remove.width).toBeLessThanOrEqual(tag.x + tag.width);
});

test("tones use their token pair in dark theme", async ({ page }) => {
  await visit(page, "tones", "&globals=theme:dark");
  const tag = page.locator('.prava-tag[data-tone="danger"]');
  await expect(tag).toHaveCSS("background-color", "rgb(85, 31, 29)");
  await expect(tag).toHaveCSS("color", "rgb(255, 213, 209)");
});

// Writes review screenshots only when asked: TAG_SHOTS=<dir>.
test("screenshots in light and dark", async ({ page }) => {
  const shots = process.env.TAG_SHOTS;
  test.skip(!shots);
  await page.setViewportSize({ width: 520, height: 160 });
  for (const story of ["default", "selectable", "sizes", "rtl"]) {
    await visit(page, story);
    await page.screenshot({ path: `${shots}/tag-${story}-light.png` });
    await visit(page, story, "&globals=theme:dark");
    await page.screenshot({ path: `${shots}/tag-${story}-dark.png` });
  }
});

test.describe("coarse pointer", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 320, height: 640 },
  });
  test.skip(({ browserName }) => browserName !== "chromium");

  test("remove reaches 44px outside its box with no geometry shift, and a tap removes", async ({
    page,
  }) => {
    await visit(page, "selectable-and-removable");
    const remove = page.locator(".prava-tag__remove");
    const box = (await remove.boundingBox())!;
    expect(box.width).toBe(24);
    expect(box.height).toBe(24);
    expect((await page.locator(".prava-tag").boundingBox())!.height).toBe(32);
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.className,
      [box.x + box.width / 2, box.y + box.height / 2 - 20],
    );
    expect(hit).toBe("prava-tag__remove");
    await remove.tap();
    await expect(page.locator(".prava-tag")).toHaveCount(0);
  });
});
