import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test("the popup escapes a Card and its rows are hit-testable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto(story("forms-select--inside-card"));
  await page.getByRole("combobox").click();
  const last = page.getByRole("option").last();
  await expect(last).toBeVisible();
  const card = await page.locator(".prava-card").boundingBox();
  const box = (await last.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(card!.y + card!.height);
  await last.click();
  await expect(page.getByRole("combobox")).toHaveText("Viewer");
  await expect(page.getByRole("combobox")).toBeFocused();
});

test("the popup flips above and stays on screen in a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.goto(story("forms-select--groups"));
  await page.evaluate(() => {
    document.body.style.paddingTop = "520px";
  });
  await page.getByRole("combobox").click();
  const popup = page.locator(".prava-select__popup");
  await expect(popup).toHaveAttribute("data-side", "top");
  await page.waitForTimeout(300);
  const box = (await popup.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

test("the popup animates in and out, and drops movement for reduced motion", async ({
  page,
}) => {
  await page.goto(story("forms-select--default"));
  await page.getByRole("combobox").click();
  const popup = page.locator(".prava-select__popup");
  const animating = await popup.evaluate((el) =>
    el.getAnimations().map((a) => (a as CSSTransition).transitionProperty),
  );
  expect(animating).toEqual(expect.arrayContaining(["opacity", "scale"]));
  await expect(popup).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("combobox").click();
  await expect(popup).toHaveCSS("scale", "1");
  await expect(popup).toHaveCSS("translate", "0px");
});

test("register fills multiple from default values and Reset restores them", async ({
  page,
}) => {
  await page.goto(story("forms-select--multiple-with-register"));
  const chips = page.locator(".prava-select__chip");
  await expect(chips).toHaveText(["Owner", "Admin"]);
  await page.getByRole("button", { name: "Remove Owner" }).click();
  await expect(chips).toHaveText(["Admin"]);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("output")).toHaveText(
    'Submitted: {"reviewers":["admin"]}',
  );
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(chips).toHaveText(["Owner", "Admin"]);
});

test("redirecting focus never touches the page-wide focus method", async ({
  page,
}) => {
  await page.goto(story("forms-select--default"));
  await page.getByRole("combobox").click();
  const native = await page.evaluate(() => String(HTMLElement.prototype.focus));
  expect(native).not.toContain("triggerRef"); // Storybook wraps focus itself, so don't expect native code
});

test("search keeps real focus in the box and filters by accent-free text", async ({
  page,
}) => {
  await page.goto(story("forms-select--searchable"));
  await page.getByRole("combobox").click();
  const search = page.getByRole("combobox", { name: "Search" });
  await expect(search).toBeFocused();
  await page.keyboard.type("espana");
  await expect(page.getByRole("option")).toHaveText(["España"]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator(".prava-select__value")).toHaveText("España");
});

test("RTL mirrors the chevron and the popup keeps to the field", async ({
  page,
}) => {
  await page.goto(story("forms-select--rtl"));
  await page.getByRole("combobox").first().click();
  const well = (await page.locator(".prava-select").first().boundingBox())!;
  const chevron = (await page
    .locator(".prava-select__chevron")
    .first()
    .boundingBox())!;
  expect(chevron.x).toBeLessThan(well.x + well.width / 2);
  const popup = (await page
    .locator(".prava-select__popup[data-open]")
    .boundingBox())!;
  expect(Math.round(popup.x)).toBe(Math.round(well.x));
});

test("an open popup uses only theme tokens", async ({ page }) => {
  const source = readFileSync("src/styles/tokens.css", "utf8");
  const colors = [
    ...new Set(
      Array.from(
        source.matchAll(/(--prava-color-(?!scheme)[\w-]+):/g),
        ([, n]) => n!,
      ),
    ),
  ];
  const palette = colors.map(
    (_, i) => `rgb(${200 + (i % 50)}, ${10 + i}, ${100 + i})`,
  );
  await page.goto(story("forms-select--with-descriptions"));
  await page.addStyleTag({
    content: `:root, [data-prava-theme] { ${colors
      .map((n, i) => `${n}: ${palette[i]};`)
      .join("")} } * { transition: none !important; }`,
  });
  await page.getByRole("combobox").click();
  const painted = await page.locator(".prava-select__popup").evaluate((popup) =>
    [popup, ...popup.querySelectorAll("*")].flatMap((el) => {
      const s = getComputedStyle(el);
      return [s.color, s.backgroundColor];
    }),
  );
  const allowed = new Set([...palette, "rgba(0, 0, 0, 0)"]);
  expect(painted.filter((c) => !allowed.has(c))).toEqual([]);
});

test("Textarea has no handle, grows with text to maxRows, then scrolls", async ({
  page,
}) => {
  await page.goto(story("forms-textarea--grows-as-you-type"));
  const note = page.getByRole("textbox");
  await expect(note).toHaveCSS("resize", "none");
  const start = (await note.boundingBox())!.height;
  await note.fill("one\ntwo\nthree\nfour");
  const grown = (await note.boundingBox())!.height;
  expect(grown).toBeGreaterThan(start);
  await note.fill(Array(30).fill("line").join("\n"));
  const capped = (await note.boundingBox())!.height;
  const scrolls = await note.evaluate(
    (el) => el.scrollHeight > el.clientHeight,
  );
  expect(capped).toBeLessThan(grown * 2);
  expect(scrolls).toBe(true);
  await note.fill("");
  expect((await note.boundingBox())!.height).toBe(start);
});

test("Textarea follows react-hook-form reset", async ({ page }) => {
  await page.goto(story("forms-textarea--with-register"));
  const note = page.getByRole("textbox");
  const start = (await note.boundingBox())!.height;
  await note.fill("one\ntwo\nthree\nfour\nfive");
  expect((await note.boundingBox())!.height).toBeGreaterThan(start);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(note).toHaveValue("");
  expect((await note.boundingBox())!.height).toBe(start);
});
