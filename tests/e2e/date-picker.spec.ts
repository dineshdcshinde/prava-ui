import { expect, test, type Page } from "@playwright/test";

const story = (name: string) =>
  `/iframe.html?id=forms-datepicker--${name}&viewMode=story`;
const focusedDate = (page: Page) =>
  page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.date,
  );
const chooser = (page: Page) => page.locator(".prava-date-picker__button");
const noOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("the full keyboard flow, with focus held in the modal", async ({
  page,
}) => {
  await page.goto(story("default"));
  await page.getByRole("textbox", { name: "Due date" }).focus();
  await page.keyboard.press("Tab");
  await expect(chooser(page)).toBeFocused();
  await expect(chooser(page)).toHaveAttribute(
    "aria-label",
    "Change date, Thursday, November 5, 2026",
  );

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Choose date" });
  await expect(dialog).toBeVisible();
  expect(await focusedDate(page)).toBe("2026-11-05");
  await expect(dialog).toHaveJSProperty("open", true);
  expect(await dialog.evaluate((el) => el.matches(":modal"))).toBe(true);

  await page.keyboard.press("ArrowRight");
  expect(await focusedDate(page)).toBe("2026-11-06");
  // Focus is visible on the day itself, in the focus color rather than transparent.
  await expect(
    dialog.locator('[data-date="2026-11-06"] .prava-calendar__day-label'),
  ).not.toHaveCSS("outline-color", "rgba(0, 0, 0, 0)");
  await page.keyboard.press("ArrowDown");
  expect(await focusedDate(page)).toBe("2026-11-13");
  await page.keyboard.press("Home");
  expect(await focusedDate(page)).toBe("2026-11-08");
  await page.keyboard.press("End");
  expect(await focusedDate(page)).toBe("2026-11-14");
  await page.keyboard.press("PageDown");
  expect(await focusedDate(page)).toBe("2026-12-14");
  await expect(dialog.getByText("December 2026")).toBeVisible();
  await page.keyboard.press("Shift+PageUp");
  expect(await focusedDate(page)).toBe("2025-12-14");

  // The modal keeps Tab off the page: past the last stop focus leaves for the browser, then comes back.
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () =>
        document.activeElement === document.body ||
        document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Previous year" }),
  ).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(chooser(page)).toBeFocused();
  await expect(page.getByRole("textbox")).toHaveValue("11/05/2026");

  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("textbox")).toHaveValue("11/06/2026");
  await expect(chooser(page)).toBeFocused();
});

test("a press outside closes it, and a press on a day chooses", async ({
  page,
}) => {
  await page.goto(story("default"));
  await chooser(page).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.mouse.click(700, 600);
  await expect(dialog).toBeHidden();

  await chooser(page).click();
  await dialog.getByRole("gridcell", { name: "November 20, 2026" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("textbox")).toHaveValue("11/20/2026");
});

test("typed entry commits, and a bad date explains itself", async ({
  page,
}) => {
  await page.goto(story("default"));
  const input = page.getByRole("textbox");
  await input.fill("2/29/2024");
  await input.press("Tab");
  await expect(input).toHaveValue("02/29/2024");

  await input.fill("2/30/2026");
  await input.press("Tab");
  await expect(input).toHaveValue("2/30/2026");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Enter a valid value.")).toBeVisible();

  await input.fill("2026-03-04");
  await input.press("Tab");
  await expect(input).toHaveValue("03/04/2026");
  await expect(page.getByText("Enter a valid value.")).toBeHidden();
});

test("range: picks two ends and shows them", async ({ page }) => {
  await page.goto(story("range"));
  await expect(page.getByRole("textbox")).toHaveValue(
    "11/05/2026 – 11/12/2026",
  );
  await chooser(page).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('[aria-selected="true"]')).toHaveCount(8);
  await dialog.getByRole("gridcell", { name: "November 16, 2026" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("gridcell", { name: "November 18, 2026" }).hover();
  await expect(dialog.locator("[data-in-range]")).toHaveCount(3);
  await dialog.getByRole("gridcell", { name: "November 18, 2026" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("textbox")).toHaveValue(
    "11/16/2026 – 11/18/2026",
  );
});

test("limits: disabled days are reachable but not choosable", async ({
  page,
}) => {
  await page.goto(story("limits"));
  await chooser(page).click();
  const saturday = page.getByRole("gridcell", { name: "November 14, 2026" });
  await expect(saturday).toHaveAttribute("aria-disabled", "true");
  await expect(saturday.locator("span")).toHaveCSS(
    "text-decoration-line",
    "line-through",
  );
  await saturday.click({ force: true }); // Playwright waits forever on aria-disabled
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("PageUp");
  expect(await focusedDate(page)).toBe("2026-11-02");
});

test("RTL: arrows mirror, chevrons mirror, and the popup aligns to the right", async ({
  page,
}) => {
  await page.goto(story("rtl"));
  const well = page.locator(".prava-date-picker");
  await chooser(page).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await focusedDate(page)).toBe("2026-11-05");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedDate(page)).toBe("2026-11-06");
  await page.keyboard.press("ArrowRight");
  expect(await focusedDate(page)).toBe("2026-11-05");
  // Egypt's week starts on Saturday, in the first column at the right edge.
  await expect(dialog.getByRole("columnheader").first()).toHaveAttribute(
    "abbr",
    "السبت",
  );
  const first = (await dialog.getByRole("columnheader").first().boundingBox())!;
  const last = (await dialog.getByRole("columnheader").last().boundingBox())!;
  expect(first.x).toBeGreaterThan(last.x);
  await page.waitForTimeout(300);
  const popup = (await dialog.boundingBox())!;
  const anchor = (await well.boundingBox())!;
  expect(
    Math.abs(popup.x + popup.width - (anchor.x + anchor.width)),
  ).toBeLessThan(2);
  await expect(
    dialog.getByRole("button", { name: "الشهر التالي" }),
  ).toBeVisible();
  expect(
    await dialog
      .locator(".prava-calendar__nav svg")
      .first()
      .evaluate((el) => getComputedStyle(el).scale),
  ).toBe("-1 1");
});

for (const [name, url] of [
  ["default", "default"],
  ["range", "range"],
  ["rtl", "rtl"],
]) {
  test(`fits 320px with nothing clipped: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(story(url!));
    await expect(chooser(page)).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    await chooser(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(300);
    expect(await noOverflow(page)).toBe(true);
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.y + box.height).toBeLessThanOrEqual(640);
    const clipped = await dialog.evaluate((el) => {
      const outer = el.getBoundingClientRect();
      return Array.from(
        el.querySelectorAll(".prava-calendar__day, .prava-calendar__nav"),
      ).filter((child) => {
        const rect = child.getBoundingClientRect();
        return rect.left < outer.left - 0.5 || rect.right > outer.right + 0.5;
      }).length;
    });
    expect(clipped).toBe(0);
  });
}

test("the popup escapes an overflow-hidden Card", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto(story("inside-card"));
  await chooser(page).click();
  const last = page.getByRole("gridcell", { name: "November 30, 2026" });
  await expect(last).toBeVisible();
  const card = (await page.locator(".prava-card").boundingBox())!;
  const box = (await last.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(card.y + card.height);
  await last.click();
  await expect(page.getByRole("textbox")).toHaveValue("11/30/2026");
});

test("react-hook-form submits the ISO value", async ({ page }) => {
  await page.goto(story("with-react-hook-form"));
  await chooser(page).click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("output")).toHaveText(
    'Submitted: {"due":"2026-11-06"}',
  );
});

for (const theme of ["light", "dark"] as const) {
  test(`renders in the ${theme} theme`, async ({ page }, info) => {
    await page.setViewportSize({ width: 480, height: 560 });
    await page.goto(`${story("limits")}&globals=theme:${theme}`);
    await chooser(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(350);
    const colors = await dialog.evaluate((el) => ({
      background: getComputedStyle(el).backgroundColor,
      text: getComputedStyle(el).color,
    }));
    expect(colors.background).toBe(
      theme === "dark" ? "rgb(21, 25, 36)" : "rgb(251, 252, 254)",
    );
    await page.screenshot({
      path: process.env.DATE_PICKER_SHOTS
        ? `${process.env.DATE_PICKER_SHOTS}/${theme}.png`
        : info.outputPath(`${theme}.png`),
    });
  });
}
