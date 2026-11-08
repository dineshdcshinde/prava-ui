import { expect, test, type Page } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=navigation-breadcrumb--${name}&viewMode=story`;
const noOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("the collapsed menu works by keyboard and opens links", async ({
  page,
}) => {
  await page.goto(story("collapsed"));
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Home" })).toBeFocused();
  await page.keyboard.press("Tab");
  const trigger = page.getByRole("button", { name: "Show hidden items" });
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("Enter");
  const first = page.getByRole("menuitem", { name: "Projects" });
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Prava" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("menu")).toBeHidden();

  await page.keyboard.press("Enter");
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#projects$/);
});

test("the default separator mirrors in RTL and the path runs right to left", async ({
  page,
}) => {
  await page.goto(story("rtl"));
  const nav = page.getByRole("navigation", { name: "مسار التنقل" });
  await expect(nav).toBeVisible();
  await expect(nav.locator(".prava-breadcrumb__chevron").first()).toHaveCSS(
    "transform",
    "matrix(-1, 0, 0, 1, 0, 0)",
  );
  const home = await page.getByRole("link", { name: "الرئيسية" }).boundingBox();
  const last = await page.getByText("الإعدادات").boundingBox();
  expect(home!.x).toBeGreaterThan(last!.x);

  await page.getByRole("button", { name: "إظهار العناصر المخفية" }).click();
  await expect(page.getByRole("menuitem", { name: "المشاريع" })).toBeVisible();

  await page.goto(story("default"));
  await expect(page.locator(".prava-breadcrumb__chevron").first()).toHaveCSS(
    "transform",
    "none",
  );
});

for (const name of ["long-labels", "collapsed", "rtl"]) {
  test(`${name} does not overflow at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(story(name));
    const root = page.locator(".prava-breadcrumb");
    await expect(root).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    const box = (await root.boundingBox())!;
    for (const label of await page.locator(".prava-breadcrumb__label").all()) {
      const rect = (await label.boundingBox())!;
      expect(rect.x).toBeGreaterThanOrEqual(box.x - 0.5);
      expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
  });
}

test("the menu stays inside a 320px viewport with nothing clipped", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(story("collapsed"));
  await page.getByRole("button", { name: "Show hidden items" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const last = page.getByRole("menuitem").last();
  // Hit-testable means the last row isn't cut off by anything above or around it.
  await last.hover();
  await expect(last).toBeFocused();
  const box = (await menu.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(await noOverflow(page)).toBe(true);
});

test("renders in light and dark", async ({ page }, info) => {
  await page.setViewportSize({ width: 640, height: 240 });
  await page.goto(story("collapsed"));
  const color = () =>
    page
      .locator("[aria-current='page']")
      .evaluate((el) => getComputedStyle(el).color);
  await expect(page.locator("[aria-current='page']")).toBeVisible();
  const light = await color();
  await page.goto(story("default"));
  await expect(page.locator("[aria-current='page']")).toBeVisible();
  await page.screenshot({ path: info.outputPath("light.png") });

  await page.goto(`${story("default")}&globals=theme:dark`);
  await expect(page.locator("[aria-current='page']")).toBeVisible();
  await page.screenshot({ path: info.outputPath("dark.png") });

  await page.goto(`${story("collapsed")}&globals=theme:dark`);
  await expect(page.locator("[aria-current='page']")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute(
    "data-prava-theme",
    "dark",
  );
  expect(await color()).not.toBe(light);
  await page.getByRole("button", { name: "Show hidden items" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.screenshot({ path: info.outputPath("dark-menu.png") });
});
