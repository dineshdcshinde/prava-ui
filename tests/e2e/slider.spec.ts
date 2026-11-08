import { expect, test, type Locator, type Page } from "@playwright/test";

const visit = async (page: Page, story: string, query = "") => {
  await page.goto(
    `/iframe.html?id=forms-slider--${story}&viewMode=story${query}`,
  );
  await page.locator(".prava-slider").first().waitFor();
};
const fill = (root: Locator) =>
  root.locator(".prava-slider__fill").boundingBox();
const thumbCentre = async (input: Locator) => {
  const box = (await input.boundingBox())!;
  const value = await input.evaluate((el: HTMLInputElement) => ({
    now: Number(el.value),
    min: Number(el.min),
    max: Number(el.max),
    rtl: getComputedStyle(el).direction === "rtl",
  }));
  const share = (value.now - value.min) / (value.max - value.min);
  const travel = box.width - box.height;
  return {
    x: box.x + box.height / 2 + (value.rtl ? 1 - share : share) * travel,
    y: box.y + box.height / 2,
  };
};
const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
const isSliderPainted = async (input: Locator) =>
  input.evaluate((el) => ({
    appearance: getComputedStyle(el).appearance,
    background: getComputedStyle(el).backgroundColor,
  }));

test("keyboard moves the value by step, Home and End, on the native control", async ({
  page,
}) => {
  await visit(page, "default");
  const input = page.getByRole("slider", { name: "Volume" });
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(input).toHaveValue("41");
  await expect(page.locator(".prava-slider__value")).toHaveText("41");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(input).toHaveValue("39");
  await page.keyboard.press("End");
  await expect(input).toHaveValue("100");
  await page.keyboard.press("ArrowRight");
  await expect(input).toHaveValue("100");
  await page.keyboard.press("Home");
  await expect(input).toHaveValue("0");
});

test("custom appearance applies, and the fill ends under the thumb", async ({
  page,
}) => {
  await visit(page, "default");
  const input = page.getByRole("slider", { name: "Volume" });
  expect(await isSliderPainted(input)).toEqual({
    appearance: "none",
    background: "rgba(0, 0, 0, 0)",
  });
  const box = (await fill(page.locator(".prava-slider")))!;
  const centre = await thumbCentre(input);
  expect(Math.abs(box.x + box.width - centre.x)).toBeLessThan(1.5);
});

test("a mouse press on the single track moves the thumb natively", async ({
  page,
}) => {
  await visit(page, "default");
  const input = page.getByRole("slider", { name: "Volume" });
  const box = (await input.boundingBox())!;
  await page.mouse.click(box.x + box.width - 14, box.y + box.height / 2);
  expect(Number(await input.inputValue())).toBeGreaterThan(90);
});

test("range thumbs drag, stop at each other, and tab in order", async ({
  page,
}) => {
  await visit(page, "range");
  const low = page.getByRole("slider", { name: "Price Minimum" });
  const high = page.getByRole("slider", { name: "Price Maximum" });
  await page.keyboard.press("Tab");
  await expect(low).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(low).toHaveValue("25");
  await page.keyboard.press("Tab");
  await expect(high).toBeFocused();
  await page.keyboard.press("Home");
  await expect(high).toHaveValue("25");
  await expect(low).toHaveValue("25");
  await page.keyboard.press("End");

  const from = await thumbCentre(low);
  const to = await thumbCentre(high);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x + 60, to.y, { steps: 8 });
  await page.mouse.up();
  await expect(low).toHaveValue("100");
  await expect(high).toHaveValue("100");
  await expect(page.locator(".prava-slider__value")).toHaveText("100 – 100");

  // Both at the far end: the low thumb is on top, so a pointer can still separate them.
  const end = await thumbCentre(low);
  await page.mouse.move(end.x, end.y);
  await page.mouse.down();
  await page.mouse.move(end.x - 100, end.y, { steps: 6 });
  await page.mouse.up();
  expect(Number(await low.inputValue())).toBeLessThan(100);
  await expect(high).toHaveValue("100");
});

test("a press on the range track moves the nearest thumb, without dragging", async ({
  page,
}) => {
  await visit(page, "range");
  const low = page.getByRole("slider", { name: "Price Minimum" });
  const high = page.getByRole("slider", { name: "Price Maximum" });
  const box = (await low.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.35, box.y + box.height / 2);
  expect(Number(await low.inputValue())).toBeGreaterThan(20);
  await expect(high).toHaveValue("80");
  await expect(low).toBeFocused();
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height / 2);
  expect(Number(await high.inputValue())).toBeLessThan(80);
});

test("RTL: the fill grows from the right, the thumb follows, and values are localized", async ({
  page,
}) => {
  await visit(page, "rtl");
  const roots = page.locator(".prava-slider");
  const single = page.getByRole("slider", { name: "الصوت" });
  const low = page.getByRole("slider", { name: "السعر الأدنى" });
  const high = page.getByRole("slider", { name: "السعر الأقصى" });
  await expect(roots.nth(0).locator(".prava-slider__value")).toHaveText("٢٥");
  await expect(roots.nth(1).locator(".prava-slider__value")).toHaveText(
    "٢٠ – ٦٠",
  );
  await expect(single).toHaveAttribute("aria-valuetext", "٢٥");
  await expect(single).toHaveValue("25");

  const track = (await roots
    .nth(0)
    .locator(".prava-slider__track")
    .boundingBox())!;
  const bar = (await fill(roots.nth(0)))!;
  expect(Math.abs(bar.x + bar.width - (track.x + track.width))).toBeLessThan(1);
  expect(bar.width).toBeLessThan(track.width / 2);
  expect(Math.abs(bar.x - (await thumbCentre(single)).x)).toBeLessThan(1.5);

  // A press on the physical right of the input means low values in RTL, proving the native thumb is mirrored.
  const box = (await single.boundingBox())!;
  await page.mouse.click(box.x + box.width - 14, box.y + box.height / 2);
  expect(Number(await single.inputValue())).toBeLessThan(10);

  // The range fill sits between its thumbs, on the mirrored side.
  const range = (await fill(roots.nth(1)))!;
  const lowCentre = await thumbCentre(low);
  const highCentre = await thumbCentre(high);
  expect(lowCentre.x).toBeGreaterThan(highCentre.x);
  expect(Math.abs(range.x + range.width - lowCentre.x)).toBeLessThan(1.5);
  expect(Math.abs(range.x - highCentre.x)).toBeLessThan(1.5);

  // Arrow keys move the thumb the way they point, which WebKit alone needs Slider's help with.
  await high.focus();
  const before = (await thumbCentre(high)).x;
  await page.keyboard.press("ArrowLeft");
  await expect(high).toHaveValue("61");
  expect((await thumbCentre(high)).x).toBeLessThan(before);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(high).toHaveValue("59");
  await page.keyboard.press("End");
  await expect(high).toHaveValue("100");
});

test("disabled thumbs ignore keyboard and pointer", async ({ page }) => {
  await visit(page, "states");
  const single = page.getByRole("slider", { name: "Disabled", exact: true });
  await expect(single).toBeDisabled();
  await expect(
    page.getByRole("slider", { name: "Disabled range Minimum" }),
  ).toBeDisabled();
  const box = (await single.boundingBox())!;
  await page.mouse.click(box.x + box.width - 10, box.y + box.height / 2);
  await expect(single).toHaveValue("40");
  const low = page.getByRole("slider", { name: "Disabled range Minimum" });
  const lowBox = (await low.boundingBox())!;
  await page.mouse.click(lowBox.x + 200, lowBox.y + lowBox.height / 2);
  await expect(low).toHaveValue("20");
  await expect(single).not.toBeFocused();
});

test("a native form submits and resets", async ({ page }) => {
  await visit(page, "native-form");
  await page.getByRole("slider", { name: "Volume" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("slider", { name: "Price Maximum" }).focus();
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("output")).toHaveText(
    '{"volume":"41","price":["20","79"]}',
  );
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("40");
  await expect(page.getByRole("slider", { name: "Price Maximum" })).toHaveValue(
    "80",
  );
});

test("react-hook-form round-trips the field prop, then resets", async ({
  page,
}) => {
  await visit(page, "react-hook-form");
  const volume = page.getByRole("slider", { name: "Volume" });
  const low = page.getByRole("slider", { name: "Price Minimum" });
  await volume.focus();
  await page.keyboard.press("ArrowRight");
  await low.focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("output")).toHaveText(
    'Submitted: {"volume":41,"price":[21,80]}',
  );
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(volume).toHaveValue("40");
  await expect(low).toHaveValue("20");
});

test("fits 320px in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const story of ["default", "range", "states", "rtl"]) {
    await visit(page, story);
    await noOverflow(page);
  }
});

// Asks the browser what a press at this point would hit, which measures the thumb's real target in any engine.
const hitsThumb = async (page: Page, input: Locator, offset: number) => {
  const { x, y } = await thumbCentre(input);
  return page.evaluate(
    ([px, py]) =>
      document.elementFromPoint(px!, py!) instanceof HTMLInputElement,
    [x + offset, y],
  );
};

test("fine pointers get a 24px target", async ({ page }) => {
  await visit(page, "range");
  expect(
    (await page.locator(".prava-slider__control").boundingBox())!.height,
  ).toBe(24);
  const low = page.getByRole("slider", { name: "Price Minimum" });
  expect(await hitsThumb(page, low, 11)).toBe(true);
  expect(await hitsThumb(page, low, -11)).toBe(true);
  expect(await hitsThumb(page, low, 14)).toBe(false);
});

test.describe("touch", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 700 },
  });
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "isMobile and pointer: coarse emulation are Chromium-only on desktop projects",
  );

  test("coarse pointers get a 44px target, and a tap on the track moves a thumb", async ({
    page,
  }) => {
    await visit(page, "range");
    expect(
      (await page.locator(".prava-slider__control").boundingBox())!.height,
    ).toBe(44);
    const low = page.getByRole("slider", { name: "Price Minimum" });
    expect(await hitsThumb(page, low, 21)).toBe(true);
    expect(await hitsThumb(page, low, -21)).toBe(true);
    expect(await hitsThumb(page, low, 24)).toBe(false);
    const { x, y } = await thumbCentre(low);
    await page.touchscreen.tap(x + 40, y);
    expect(Number(await low.inputValue())).toBeGreaterThan(20);
  });
});

test("dark theme paints with dark tokens", async ({ page, browserName }) => {
  const shots = process.env.SLIDER_SHOTS;
  await visit(page, "range");
  if (shots)
    await page.screenshot({ path: `${shots}/light-${browserName}.png` });
  const color = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await color(".prava-slider__fill");

  await visit(page, "range", "&globals=theme:dark");
  await expect.poll(() => color(".prava-slider__fill")).not.toBe(light);
  if (shots)
    await page.screenshot({ path: `${shots}/dark-${browserName}.png` });

  await visit(page, "states", "&globals=theme:dark");
  if (shots)
    await page.screenshot({ path: `${shots}/states-dark-${browserName}.png` });
});

test("forced colors keep the track, fill and thumb visible", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await visit(page, "range");
  const shots = process.env.SLIDER_SHOTS;
  const color = (selector: string) =>
    page
      .locator(selector)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await color(".prava-slider__fill")).not.toBe(
    await color(".prava-slider__track"),
  );
  await page.getByRole("slider", { name: "Price Minimum" }).focus();
  await page.keyboard.press("ArrowRight");
  if (shots) await page.screenshot({ path: `${shots}/forced.png` });
  await page.emulateMedia({ forcedColors: "none" });
  await page.keyboard.press("ArrowRight");
  if (shots) await page.screenshot({ path: `${shots}/focus.png` });
});
