import { expect, test, type Page } from "@playwright/test";

const visit = async (page: Page, id: string, query = "") => {
  await page.goto(
    `/iframe.html?id=forms-numberinput--${id}&viewMode=story${query}`,
  );
  await page.getByRole("spinbutton").first().waitFor();
};
const noOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("keyboard: Tab skips the buttons; arrows, Home and End step and clamp", async ({
  page,
}) => {
  await visit(page, "default");
  const input = page.getByRole("spinbutton", { name: "Quantity" });
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(input).toHaveValue("2");
  await expect(input).toHaveAttribute("aria-valuenow", "2");
  await page.keyboard.press("End");
  await expect(input).toHaveValue("10");
  await expect(page.getByRole("button", { name: "Increase" })).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(input).toHaveValue("0");
  await expect(page.getByRole("button", { name: "Decrease" })).toBeDisabled();

  // Typing is left alone until blur.
  await page.keyboard.press("Control+A");
  await page.keyboard.type("250");
  await expect(input).toHaveValue("250");
  await page.keyboard.press("Tab");
  await expect(input).toHaveValue("10");
  await expect(input).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    "BUTTON",
  );
});

test("a button click steps and keeps focus in the field", async ({ page }) => {
  await visit(page, "default");
  const input = page.getByRole("spinbutton", { name: "Quantity" });
  await input.click();
  await page.getByRole("button", { name: "Increase" }).click();
  await expect(input).toHaveValue("2");
  await expect(input).toBeFocused();
});

test("German separators parse to the number", async ({ page }) => {
  await visit(page, "german");
  const input = page.getByRole("spinbutton", { name: "Betrag" });
  await expect(input).toHaveValue("1.234,5");
  await input.fill("9.876,25");
  await expect(page.getByText("Value: 9876.25")).toBeVisible();
  await input.fill("9.876,");
  await expect(input).toHaveValue("9.876,");
  await input.blur();
  await expect(input).toHaveValue("9.876");
});

test("RTL: buttons sit on the left, Arabic digits parse, names are localized", async ({
  page,
}) => {
  await visit(page, "rtl");
  const input = page.getByRole("spinbutton", { name: "الكمية" });
  const plus = page.getByRole("button", { name: "زيادة" });
  const inputBox = (await input.boundingBox())!;
  const plusBox = (await plus.boundingBox())!;
  expect(plusBox.x).toBeLessThan(inputBox.x + inputBox.width / 2);
  await expect(input).toHaveValue("١٬٢٣٤٫٥");
  await input.fill("١٢٫٥");
  await expect(page.getByText("Value: 12.5")).toBeVisible();
  await input.blur();
  await plus.click();
  await expect(input).toHaveValue("١٣٫٥");
  expect(await noOverflow(page)).toBe(true);
});

test("native form: submits plain digits, clamps on Enter, and resets", async ({
  page,
}) => {
  await visit(page, "native-form");
  const input = page.getByRole("spinbutton", { name: "Betrag" });
  await input.fill("1.500,75");
  await page.keyboard.press("Enter");
  await expect(page.getByText('Submitted: {"amount":"1500.75"}')).toBeVisible();
  await input.fill("9.000");
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("2.000");
  await expect(page.getByText('Submitted: {"amount":"2000"}')).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(input).toHaveValue("");
});

test("native form: an empty required field blocks submit with a localized message", async ({
  page,
}) => {
  await visit(page, "native-form");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Fill in this field.")).toBeVisible();
  await expect(page.getByRole("spinbutton")).toBeFocused();
  await expect(page.locator("output")).toHaveCount(0);
});

for (const story of ["with-register", "with-controller"]) {
  test(`${story}: the form receives a number, or a required error for empty`, async ({
    page,
  }) => {
    await visit(page, story);
    const input = page.getByRole("spinbutton", { name: "Quantity" });
    await input.fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Enter a quantity.")).toBeVisible();
    await expect(input).toBeFocused();
    await input.fill("7");
    await page.getByRole("button", { name: "Increase" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText('Submitted: {"quantity":8}')).toBeVisible();
  });
}

test("fits 320px in every state and the buttons stay inside the well", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await visit(page, "states");
  expect(await noOverflow(page)).toBe(true);
  const input = page.getByRole("spinbutton", { name: "At its limit" });
  const inputBox = (await input.boundingBox())!;
  const buttonBox = (await page
    .getByRole("button", { name: "Decrease" })
    .first()
    .boundingBox())!;
  expect(buttonBox.y).toBeGreaterThanOrEqual(inputBox.y);
  expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(
    inputBox.y + inputBox.height,
  );
  expect(buttonBox.height).toBeGreaterThanOrEqual(24);
  expect(buttonBox.width).toBeGreaterThanOrEqual(24);
});

test("sizes: buttons fill each control's height", async ({ page }) => {
  await visit(page, "sizes");
  for (const name of ["sm input", "md input", "lg input"]) {
    const input = page.getByRole("spinbutton", { name });
    const group = input.locator(
      "xpath=ancestor::span[contains(@class,'prava-number-input')][1]",
    );
    const box = (await input.boundingBox())!;
    const buttons = (await group
      .locator(".prava-number-input__buttons")
      .boundingBox())!;
    expect(Math.abs(box.height - buttons.height - 2)).toBeLessThanOrEqual(0.5);
  }
});

test("dark theme renders from tokens", async ({ page }, info) => {
  await visit(page, "states");
  const input = page.getByRole("spinbutton", { name: "At its limit" });
  const light = await input.evaluate((el) => getComputedStyle(el).color);
  await page.screenshot({ path: info.outputPath("light.png") });
  await visit(page, "states", "&globals=theme:dark");
  expect(await input.evaluate((el) => getComputedStyle(el).color)).not.toBe(
    light,
  );
  await page.screenshot({ path: info.outputPath("dark.png") });
});
