import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=display-table--${name}&viewMode=story`;
const fitsViewport = () =>
  document.documentElement.scrollWidth <= window.innerWidth;

test("the named region scrolls by keyboard inside itself at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(story("default"));

  const region = page.getByRole("region", {
    name: "Invoices issued this quarter",
  });
  await expect(region).toBeVisible();
  expect(await page.evaluate(fitsViewport)).toBe(true);
  expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );

  await page.keyboard.press("Tab");
  await expect(region).toBeFocused();
  await expect(region).not.toHaveCSS("outline-color", "rgba(0, 0, 0, 0)");
  expect(
    parseFloat(
      await region.evaluate((el) => getComputedStyle(el).outlineWidth),
    ),
  ).toBeGreaterThan(0);

  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => region.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  expect(await page.evaluate(fitsViewport)).toBe(true);
});

test("RTL mirrors columns and scrolling, at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(story("rtl"));

  const region = page.getByRole("region", { name: "فواتير هذا الربع" });
  await expect(region).toBeVisible();
  expect(await page.evaluate(fitsViewport)).toBe(true);

  const first = page.getByRole("columnheader", { name: "الفاتورة" });
  const second = page.getByRole("columnheader", { name: "العميل" });
  expect((await first.boundingBox())!.x).toBeGreaterThan(
    (await second.boundingBox())!.x,
  );
  // Starts at the inline start: the first column is on the visual right, fully in view.
  const box = (await region.boundingBox())!;
  const firstBox = (await first.boundingBox())!;
  expect(firstBox.x + firstBox.width).toBeLessThanOrEqual(box.x + box.width);

  await region.focus();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() => region.evaluate((el) => el.scrollLeft))
    .toBeLessThan(0);
});

test("the sticky header stays pinned while rows scroll", async ({ page }) => {
  await page.goto(story("sticky-header"));

  const region = page.getByRole("region", { name: "All invoices" });
  const head = page.getByRole("columnheader", { name: "Client" });
  await expect(head).toBeVisible();
  expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
    true,
  );

  await region.focus();
  await region.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const regionTop = (await region.boundingBox())!.y;
  await expect
    .poll(async () => Math.abs((await head.boundingBox())!.y - regionTop))
    .toBeLessThan(2);

  // Keyboard scrolling still works from the end back up.
  await page.keyboard.press("ArrowUp");
  await expect
    .poll(() =>
      region.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
    )
    .toBeGreaterThan(0);
});

test("compact density is tighter than comfortable", async ({ page }) => {
  const rowHeight = async (name: string) => {
    await page.goto(story(name));
    const cell = page.getByRole("cell", { name: "Northwind Traders" });
    await expect(cell).toBeVisible();
    return (await cell.boundingBox())!.height;
  };
  expect(await rowHeight("compact")).toBeLessThan(await rowHeight("default"));
});

test("renders from tokens in light and dark", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 420 });
  await page.goto(story("default"));
  const region = page.locator(".prava-table");
  await expect(region).toBeVisible();
  const lightBackground = await region.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.screenshot({ path: join(tmpdir(), "prava-table-light.png") });

  await page.goto(`${story("default")}&globals=theme:dark`);
  await expect(page.locator("body")).toHaveAttribute(
    "data-prava-theme",
    "dark",
  );
  await expect(region).not.toHaveCSS("background-color", lightBackground);
  await expect(page.getByRole("cell", { name: "Paid" }).first()).toHaveCSS(
    "color",
    "rgb(230, 233, 240)",
  );
  await page.screenshot({ path: join(tmpdir(), "prava-table-dark.png") });
});
