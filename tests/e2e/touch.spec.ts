import { expect, test, type Locator, type Page } from "@playwright/test";

const visit = async (page: Page, id: string, query = "") => {
  await page.goto(`/iframe.html?id=${id}&viewMode=story${query}`);
  await page
    .locator("#storybook-root *")
    .first()
    .waitFor({ state: "attached" });
};
const settled = (locator: Locator) =>
  locator.evaluate((el) =>
    Promise.allSettled(el.getAnimations().map((a) => a.finished)),
  );
const onScreen = async (page: Page, locator: Locator) => {
  const box = (await locator.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
};
// WCAG 2.2's AAA target size, which the coarse-pointer styles aim for.
const TOUCH_TARGET = 44;

test("Select: a tap opens it on screen, rows are big enough, and a tap chooses", async ({
  page,
}) => {
  await visit(page, "forms-select--auto-placement");
  await page.getByRole("combobox", { name: "Bottom end" }).tap();
  const popup = page.locator(".prava-select__popup[data-open]");
  await settled(popup);
  await expect(popup).toHaveAttribute("data-side", "top");
  await onScreen(page, popup);
  const option = page.getByRole("option", { name: "Editor" });
  expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(
    TOUCH_TARGET,
  );
  await option.tap();
  await expect(popup).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Bottom end" })).toHaveText(
    "Editor",
  );
});

test("Select: a tap outside closes it", async ({ page }) => {
  await visit(page, "forms-select--default");
  await page.getByRole("combobox").tap();
  const popup = page.locator(".prava-select__popup[data-open]");
  await settled(popup);
  await page.touchscreen.tap(5, page.viewportSize()!.height - 5);
  await expect(popup).toBeHidden();
});

test("Tooltip: a tap shows it, and it stays until a tap elsewhere", async ({
  page,
}) => {
  await visit(page, "overlays-tooltip--default");
  await page.getByRole("button", { name: "Publish" }).tap();
  const tip = page.getByRole("tooltip");
  await expect(tip).toBeVisible();
  await settled(tip);
  await page.waitForTimeout(300);
  await expect(tip).toBeVisible();
  await onScreen(page, tip);
  await page.touchscreen.tap(5, 5);
  await expect(tip).toBeHidden();
});

test("DropdownMenu: a tap opens it, rows are big enough, and a tap chooses", async ({
  page,
}) => {
  await visit(page, "overlays-dropdownmenu--default");
  await page.getByRole("button", { name: "Actions" }).tap();
  const menu = page.getByRole("menu");
  await settled(menu);
  await onScreen(page, menu);
  const item = page.getByRole("menuitem", { name: "Duplicate" });
  expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(
    TOUCH_TARGET,
  );
  await item.tap();
  await expect(menu).toBeHidden();
});

test("Popover: a tap opens it on screen, and a tap outside closes it", async ({
  page,
}) => {
  await visit(page, "overlays-popover--default");
  await page.getByRole("button", { name: "Share" }).tap();
  const popup = page.getByRole("dialog");
  await settled(popup);
  await onScreen(page, popup);
  await page.touchscreen.tap(5, page.viewportSize()!.height - 5);
  await expect(popup).toBeHidden();
});

test("Dialog: fits the phone, the close button is big enough, and a backdrop tap closes it", async ({
  page,
}) => {
  await visit(page, "overlays-dialog--default");
  await page.getByRole("button", { name: "Invite" }).tap();
  const dialog = page.locator("dialog");
  await settled(dialog);
  await onScreen(page, dialog);
  const close = (await page
    .getByRole("button", { name: "Close" })
    .boundingBox())!;
  expect(close.height).toBeGreaterThanOrEqual(TOUCH_TARGET);
  expect(close.width).toBeGreaterThanOrEqual(TOUCH_TARGET);
  await page.touchscreen.tap(5, 5);
  await expect(dialog).toBeHidden();
});

test("Drawer: leaves a strip to tap, which closes it", async ({ page }) => {
  await visit(page, "overlays-drawer--end");
  await page.getByRole("button", { name: "Filters" }).tap();
  const drawer = page.locator("dialog");
  await settled(drawer);
  await onScreen(page, drawer);
  await page.touchscreen.tap(10, 300);
  await expect(drawer).toBeHidden();
});

test("Tabs: tabs are big enough, a tap selects, and swiping reaches the last one", async ({
  page,
}) => {
  await visit(page, "navigation-tabs--scrolls-when-narrow");
  const tabs = page.getByRole("tab");
  expect((await tabs.first().boundingBox())!.height).toBeGreaterThanOrEqual(
    TOUCH_TARGET,
  );
  await tabs.nth(1).tap();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await page.locator(".prava-tabs__list").evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await tabs.last().tap();
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
});

test("Accordion: headers are big enough and a tap toggles", async ({
  page,
}) => {
  await visit(page, "navigation-accordion--default");
  const header = page.getByRole("button", {
    name: "Can I change the number of seats?",
  });
  expect((await header.boundingBox())!.height).toBeGreaterThanOrEqual(
    TOUCH_TARGET,
  );
  await header.tap();
  await expect(header).toHaveAttribute("aria-expanded", "true");
});

test("Toast: fits the phone, and the dismiss button is big enough", async ({
  page,
}) => {
  await visit(page, "feedback-toast--default");
  await page.getByRole("button", { name: "Danger" }).tap();
  const toast = page.locator(".prava-toast");
  await settled(toast);
  await onScreen(page, toast);
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
  expect((await dismiss.boundingBox())!.height).toBeGreaterThanOrEqual(
    TOUCH_TARGET,
  );
  await dismiss.tap();
  await expect(toast).toHaveCount(0);
});
