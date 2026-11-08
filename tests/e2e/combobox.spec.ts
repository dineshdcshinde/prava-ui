import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const story = (id: string) =>
  `/iframe.html?id=forms-combobox--${id}&viewMode=story`;
const input = (page: Page) => page.getByRole("combobox").first();
const popup = (page: Page) => page.locator(".prava-combobox__popup").first();
const noOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("keyboard flow: open, move, accept, type, filter, escape", async ({
  page,
}) => {
  await page.goto(story("default"));
  await expect(input(page)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(input(page)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option").first()).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input(page)).toHaveValue("Patna");
  await expect(input(page)).toHaveAttribute("aria-expanded", "false");
  await expect(popup(page)).toBeHidden();

  await input(page).fill("");
  await page.keyboard.type("os");
  await expect(page.getByRole("option")).toHaveText(["Oslo", "Osaka"]);
  await expect(page.getByRole("status")).toHaveText("2 results");
  await page.keyboard.press("Escape");
  await expect(popup(page)).toBeHidden();
  await expect(input(page)).toHaveValue("os");
  await page.keyboard.press("Escape");
  await expect(input(page)).toHaveValue("");
});

test("a real IME composition keeps Enter from closing the list", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "CDP drives the IME");
  await page.goto(story("native-form"));
  const box = input(page);
  await box.click();
  await page.keyboard.press("ArrowDown");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.imeSetComposition", {
    text: "おす",
    selectionStart: 2,
    selectionEnd: 2,
  });
  await expect(box).toHaveValue("おす");
  // A synthetic Enter reaches the form, which a real IME would swallow; only our handling is under test.
  await page.keyboard.press("Enter");
  await expect(box).toHaveAttribute("aria-expanded", "true");
  await cdp.send("Input.insertText", { text: "os" });
  await expect(box).toHaveValue("os");
  await expect(page.getByRole("option", { name: "Oslo" })).toBeVisible();
});

test("the listbox is named and the active option is exposed in the real tree", async ({
  page,
}) => {
  await page.goto(story("default"));
  await input(page).click();
  await expect(page.getByRole("listbox", { name: "City" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  const id = await input(page).getAttribute("aria-activedescendant");
  expect(id).toBeTruthy();
  await expect(page.locator(`[id="${id}"]`)).toHaveAttribute("role", "option");
});

test("multiple values, custom values, and reset go through a real form", async ({
  page,
}) => {
  await page.goto(story("native-form"));
  const single = page.getByRole("combobox", { name: "City" });
  const many = page.getByRole("combobox", { name: "Cities" });
  await single.fill("Nashik");
  await page.keyboard.press("Enter");
  await many.click();
  await page.getByRole("option", { name: "Pune" }).click();
  await page.getByRole("option", { name: "Oslo" }).click();
  await expect(many).toBeFocused();
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("output")).toHaveText(
    JSON.stringify([
      ["city", "Nashik"],
      ["cities", "pune"],
      ["cities", "oslo"],
    ]),
  );
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(single).toHaveValue("");
  await expect(page.locator(".prava-combobox__chip")).toHaveCount(0);
});

test("async results: loading shows and is announced, then results, and the choice survives", async ({
  page,
}) => {
  await page.goto(story("async-server-results"));
  await input(page).click();
  await page.keyboard.type("os");
  // Checked together: the simulated request is short and a loaded machine can miss it between two assertions.
  await page.waitForFunction(
    () =>
      document
        .querySelector(".prava-combobox__list")
        ?.getAttribute("aria-busy") === "true" &&
      document.querySelector(".prava-combobox__status")?.textContent ===
        "Loading",
  );
  await expect(page.getByRole("option")).toHaveText(["Oslo", "Osaka"]);
  await expect(page.getByRole("listbox")).not.toHaveAttribute("aria-busy");
  await expect(
    page.locator(".prava-combobox__sr-only[role=status]"),
  ).toHaveText("2 results");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input(page)).toHaveValue("Osaka");
  await expect(page.locator("output")).toHaveText("Value: osaka");
});

test("hook form round trip: error, focus, submit, reset", async ({ page }) => {
  await page.goto(story("with-register"));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Pick a city.")).toBeVisible();
  await expect(input(page)).toBeFocused();
  await page.keyboard.type("oslo");
  await page.keyboard.press("Tab");
  await expect(input(page)).toHaveValue("Oslo");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("output")).toHaveText('Submitted: {"city":"oslo"}');
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(input(page)).toHaveValue("");
});

test("the popup flips above near the bottom edge and stays on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.goto(story("default"));
  await page.evaluate(() => {
    document.body.style.paddingTop = "560px";
  });
  await input(page).click();
  await expect(popup(page)).toHaveAttribute("data-side", "top");
  await page.waitForTimeout(300);
  const box = (await popup(page).boundingBox())!;
  const well = (await page.locator(".prava-combobox").boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(well.y);
  expect(box.x + box.width).toBeLessThanOrEqual(360);

  // Typing shrinks the list; it stays above rather than jumping across the field.
  await page.keyboard.type("os");
  await expect(page.getByRole("option")).toHaveCount(2);
  await expect(popup(page)).toHaveAttribute("data-side", "top");
  await page.waitForTimeout(300);
  const small = (await popup(page).boundingBox())!;
  expect(small.y + small.height).toBeLessThanOrEqual(well.y);
});

test("a short space caps the list so its last row can be reached", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 300 });
  await page.goto(story("default"));
  await input(page).click();
  await page.keyboard.press("End");
  for (let i = 0; i < 8; i++) await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  const box = (await popup(page).boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(300);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-active="true"]')).toBeInViewport();
});

test("RTL: the popup aligns to the start and the chevron sits at the end", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto(story("rtl"));
  await input(page).click();
  await page.waitForTimeout(300);
  const well = (await page.locator(".prava-combobox").first().boundingBox())!;
  const box = (await popup(page).boundingBox())!;
  expect(Math.abs(box.x + box.width - (well.x + well.width))).toBeLessThan(1);
  const chevron = (await page
    .locator(".prava-combobox__chevron")
    .first()
    .boundingBox())!;
  expect(chevron.x).toBeLessThan(well.x + well.width / 2);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(input(page)).toHaveValue("القاهرة");
});

test("fits a 320px viewport with no overflow, open and with chips", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const id of ["default", "multiple", "groups", "states", "rtl"]) {
    await page.goto(story(id));
    await input(page).click();
    await page.waitForTimeout(250);
    expect(await noOverflow(page)).toBe(true);
    const box = (await popup(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});

test("rows above the page are hit-testable, not clipped", async ({ page }) => {
  await page.goto(story("default"));
  await input(page).click();
  const last = page.getByRole("option").last();
  await expect(last).toBeVisible();
  await last.click();
  await expect(input(page)).toHaveValue("Osaka");
  await expect(input(page)).toBeFocused();
});

test("renders in light and dark", async ({ page }) => {
  const surfaces: string[] = [];
  for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width: 560, height: 520 });
    await page.goto(`${story("multiple")}&globals=theme:${theme}`);
    await expect(page.locator("body")).toHaveAttribute(
      "data-prava-theme",
      theme,
    );
    await input(page).click();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(300);
    await page.screenshot({
      path: join(tmpdir(), `prava-combobox-${theme}.png`),
    });
    surfaces.push(
      await popup(page).evaluate((el) => getComputedStyle(el).backgroundColor),
    );
  }
  expect(surfaces[0]).not.toBe(surfaces[1]);
});
