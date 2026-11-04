import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

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
  // Listen from before the click: sampling afterwards can miss a transition on a busy machine.
  await page.evaluate(() => {
    const runs: string[] = [];
    Object.assign(window, { runs });
    document.addEventListener(
      "transitionrun",
      (event) => {
        if ((event.target as Element).matches(".prava-select__popup"))
          runs.push(event.propertyName);
      },
      true,
    );
  });
  await page.getByRole("combobox").click();
  const popup = page.locator(".prava-select__popup");
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { runs: string[] }).runs),
    )
    .toEqual(expect.arrayContaining(["opacity", "scale"]));
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
  // Measure after the opening scale settles: mid-animation the box is smaller than the popup.
  const open = page.locator(".prava-select__popup[data-open]");
  await open.evaluate((el) =>
    Promise.allSettled(el.getAnimations().map((a) => a.finished)),
  );
  const popup = (await open.boundingBox())!;
  expect(popup.x).toBeCloseTo(well.x, 1);
  expect(popup.width).toBeCloseTo(well.width, 1);
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

test.describe("auto placement", () => {
  const placement = "forms-select--auto-placement";
  const openField = async (page: Page, name: string) => {
    await page.getByRole("combobox", { name }).click();
    const popup = page.locator(".prava-select__popup[data-open]");
    await popup.evaluate((el) =>
      Promise.allSettled(el.getAnimations().map((a) => a.finished)),
    );
    return popup;
  };
  const onScreen = async (page: Page, popup: Locator) => {
    const box = (await popup.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  };

  test("every position picks a side with room and stays on screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 760 });
    await page.goto(story(placement));
    const expected: Record<string, string> = {
      "Top start": "bottom",
      "Top center": "bottom",
      "Top end": "bottom",
      "Bottom start": "top",
      "Bottom center": "top",
      "Bottom end": "top",
    };
    for (const [name, side] of Object.entries(expected)) {
      const popup = await openField(page, name);
      await expect(popup).toHaveAttribute("data-side", side);
      await onScreen(page, popup);
      await page.keyboard.press("Escape");
    }
  });

  test("long options widen the list past the field without leaving the screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 760 });
    await page.goto(story(placement));
    const name = "Top end";
    const field = (await page.locator(".prava-select").nth(2).boundingBox())!;
    const popup = await openField(page, name);
    const box = (await popup.boundingBox())!;
    expect(box.width).toBeGreaterThan(field.width);
    await onScreen(page, popup);
    // Wide enough that the longest label stays on one line.
    const option = page.getByRole("option", {
      name: "Billing and compliance administrator",
    });
    expect((await option.boundingBox())!.height).toBeLessThanOrEqual(36);
  });

  test("a short screen opens beside the field, following the text direction", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 176 });
    await page.goto(`${story(placement)}&short=1`);
    let popup = await openField(page, "Short, start");
    await expect(popup).toHaveAttribute("data-side", "right");
    await onScreen(page, popup);
    await page.keyboard.press("Escape");
    popup = await openField(page, "Short, end");
    await expect(popup).toHaveAttribute("data-side", "left");
    await onScreen(page, popup);

    await page.goto(`${story(placement)}&short=1&globals=direction:rtl`);
    popup = await openField(page, "Short, start");
    await expect(popup).toHaveAttribute("data-side", "left");
    await onScreen(page, popup);
  });

  test("with no room beside it either, it stays vertical and scrolls, keeping its scroll position", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 176 });
    await page.goto(`${story(placement)}&short=1`);
    const popup = await openField(page, "Short, center");
    await expect(popup).toHaveAttribute("data-side", /top|bottom/);
    await onScreen(page, popup);
    await page.keyboard.press("End");
    await expect(page.getByRole("option", { name: "Guest" })).toBeInViewport();
    const list = popup.locator(".prava-select__list");
    const scrolled = await list.evaluate((el) => el.scrollTop);
    expect(scrolled).toBeGreaterThan(0);
    await page.waitForTimeout(200);
    expect(await list.evaluate((el) => el.scrollTop)).toBe(scrolled);
  });

  test("placement forces a side even when another has more room", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(story("forms-select--forced-placement"));
    const sides: Record<string, string> = {
      "Opens top": "top",
      "Opens bottom": "bottom",
      "Opens start": "left",
      "Opens end": "right",
    };
    for (const [name, side] of Object.entries(sides)) {
      const popup = await openField(page, name);
      await expect(popup).toHaveAttribute("data-side", side);
      await onScreen(page, popup);
      await page.keyboard.press("Escape");
    }
    expect(
      await page
        .getByRole("combobox", { name: "Opens top" })
        .getAttribute("placement"),
    ).toBeNull();
  });

  test("a forced side mirrors in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(
      `${story("forms-select--forced-placement")}&globals=direction:rtl`,
    );
    const popup = await openField(page, "Opens start");
    await expect(popup).toHaveAttribute("data-side", "right");
    await onScreen(page, popup);
  });

  test("a forced side with no usable room falls back, so the list stays usable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(story("forms-select--forced-placement"));
    await page.getByRole("combobox", { name: "Opens top" }).waitFor();
    await page.evaluate(() => {
      const row = document.querySelector<HTMLElement>(".prava-provider > div")!;
      row.style.alignItems = "flex-start";
      row.style.alignContent = "flex-start";
    });
    const top = await openField(page, "Opens top");
    await expect(top).toHaveAttribute("data-side", "bottom");
    await onScreen(page, top);
    await page.keyboard.press("Escape");
    // Too narrow to open beside the field.
    const start = await openField(page, "Opens start");
    await expect(start).toHaveAttribute("data-side", /top|bottom/);
    await onScreen(page, start);
  });

  test("filtering doesn't change the width", async ({ page }) => {
    await page.goto(story("forms-select--searchable"));
    await page.locator('[role="combobox"]').first().click();
    const popup = page.locator(".prava-select__popup[data-open]");
    await popup.evaluate((el) =>
      Promise.allSettled(el.getAnimations().map((a) => a.finished)),
    );
    const before = (await popup.boundingBox())!.width;
    await page.keyboard.type("in");
    await expect(page.getByRole("option").first()).toBeVisible();
    expect((await popup.boundingBox())!.width).toBe(before);
  });
});
