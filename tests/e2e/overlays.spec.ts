import { expect, test, type Locator, type Page } from "@playwright/test";

// Stories render after load; wait so keyboard input and queries don't race them.
const visit = async (page: Page, id: string) => {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page
    .locator("#storybook-root *")
    .first()
    .waitFor({ state: "attached" });
};
// Listens from before the action: sampling afterwards can miss a transition on a busy machine.
const recordTransitions = async (page: Page, selector: string) => {
  await page.evaluate((target) => {
    const runs: string[] = [];
    Object.assign(window, { runs });
    document.addEventListener(
      "transitionrun",
      (event) => {
        if ((event.target as Element).matches(target))
          runs.push(event.propertyName);
      },
      true,
    );
  }, selector);
  return () =>
    expect.poll(() =>
      page.evaluate(() => (window as unknown as { runs: string[] }).runs),
    );
};
const settled = (locator: Locator) =>
  locator.evaluate((el) =>
    Promise.allSettled(el.getAnimations().map((a) => a.finished)),
  );
const inViewport = async (page: Page, locator: Locator) => {
  const box = (await locator.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
};

test.describe("Dialog", () => {
  test("traps focus, closes on Escape, and returns focus to the trigger", async ({
    page,
  }) => {
    await visit(page, "overlays-dialog--default");
    const trigger = page.getByRole("button", { name: "Invite" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Work email" }),
    ).toBeFocused();

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () =>
          document.activeElement === document.body ||
          document.activeElement?.closest("dialog") != null,
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("animates in and out, unmounts its content after, and locks page scroll", async ({
    page,
  }) => {
    await visit(page, "overlays-dialog--default");
    const runs = await recordTransitions(page, "dialog");
    await page.getByRole("button", { name: "Invite" }).click();
    const dialog = page.locator("dialog");
    await runs().toEqual(expect.arrayContaining(["opacity", "translate"]));
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("hidden");

    await page.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".prava-dialog__panel")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
  });

  test("closes on a backdrop press but not on one inside the panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await visit(page, "overlays-dialog--default");
    await page.getByRole("button", { name: "Invite" }).click();
    const dialog = page.locator("dialog");
    await settled(dialog);
    await page.locator(".prava-dialog__title").click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();
  });

  test("a required choice ignores Escape and the backdrop, and honors data-autofocus", async ({
    page,
  }) => {
    await visit(page, "overlays-dialog--required-choice");
    await page.getByRole("button", { name: "Delete project" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Keep project" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Keep project" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Escape inside a Select closes only the Select", async ({ page }) => {
    await visit(page, "overlays-dialog--default");
    await page.getByRole("button", { name: "Invite" }).click();
    await page.getByRole("combobox").click();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("option").first()).toBeHidden();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("stays inside a 320px viewport, and only the body scrolls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await visit(page, "overlays-dialog--long-content");
    await page.getByRole("button", { name: "Invite" }).click();
    const dialog = page.locator("dialog");
    await settled(dialog);
    await inViewport(page, dialog);
    const body = page.locator(".prava-dialog__body");
    expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
      true,
    );
    await expect(page.locator(".prava-dialog__title")).toBeInViewport();
    await expect(page.locator(".prava-dialog__footer")).toBeInViewport();
  });

  test("non-modal leaves the page interactive", async ({ page }) => {
    await visit(page, "overlays-dialog--non-modal");
    const trigger = page.getByRole("button", { name: "Invite" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await dialog.focus();
    await page.getByRole("button", { name: "Close" }).focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("drops movement for reduced motion but keeps the fade", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visit(page, "overlays-dialog--default");
    await page.getByRole("button", { name: "Invite" }).click();
    const dialog = page.locator("dialog");
    await expect(dialog).toHaveCSS("translate", "0px");
    await expect(dialog).toHaveCSS("scale", "1");
  });
});

test.describe("Drawer", () => {
  test("sits on the inline-end edge and mirrors in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 600 });
    await visit(page, "overlays-drawer--end");
    await page.getByRole("button", { name: "Filters" }).click();
    let dialog = page.locator("dialog");
    await settled(dialog);
    let box = (await dialog.boundingBox())!;
    expect(box.x + box.width).toBe(900);
    expect(box.height).toBe(600);

    await visit(page, "overlays-drawer--right-to-left");
    await page.getByRole("button", { name: "عوامل التصفية" }).click();
    dialog = page.locator("dialog");
    await settled(dialog);
    box = (await dialog.boundingBox())!;
    expect(box.x).toBe(0);
  });

  test("slides from the edge it's on", async ({ page }) => {
    await visit(page, "overlays-drawer--right-to-left");
    await page.getByRole("button", { name: "عوامل التصفية" }).click();
    const from = await page
      .locator("dialog")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--prava-dialog-from"),
      );
    expect(from.trim()).toBe("-100% 0");
  });

  test("leaves a strip to press on a 320px screen, and bottom fits within it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await visit(page, "overlays-drawer--end");
    await page.getByRole("button", { name: "Filters" }).click();
    const dialog = page.locator("dialog");
    await settled(dialog);
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(40);
    await page.mouse.click(10, 300);
    await expect(dialog).toBeHidden();

    await visit(page, "overlays-drawer--bottom");
    await page.getByRole("button", { name: "Filters" }).click();
    await settled(dialog);
    await inViewport(page, dialog);
    expect((await dialog.boundingBox())!.width).toBe(320);
  });
});

test.describe("Popover", () => {
  test("moves focus in, Escape returns it, and tabbing away closes it", async ({
    page,
  }) => {
    await visit(page, "overlays-popover--default");
    const trigger = page.getByRole("button", { name: "Share" });
    await trigger.click();
    const popup = page.getByRole("dialog");
    await expect(popup).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Link" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("escapes a clipping Card", async ({ page }) => {
    await visit(page, "overlays-popover--inside-card");
    await page.getByRole("button", { name: "Share" }).click();
    const popup = page.getByRole("dialog");
    await settled(popup);
    const card = (await page.locator(".prava-card").boundingBox())!;
    const box = (await popup.boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(card.y + card.height);
  });

  test("flips and stays on screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 300 });
    await visit(page, "overlays-popover--placements");
    await page.getByRole("button", { name: "end" }).click();
    const end = page.getByRole("dialog", { name: "end" });
    await settled(end);
    await inViewport(page, end);

    await visit(page, "overlays-popover--default");
    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("#storybook-root")!;
      root.style.cssText =
        "position: fixed; bottom: 8px; inset-inline-start: 8px; padding: 0";
    });
    await page.getByRole("button", { name: "Share" }).click();
    const popup = page.getByRole("dialog");
    await expect(popup).toHaveAttribute("data-side", "top");
    await settled(popup);
    await inViewport(page, popup);
  });

  test("start and end follow the text direction", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 500 });
    await visit(page, "overlays-popover--right-to-left");
    const trigger = page.getByRole("button", { name: "مشاركة" });
    await trigger.click();
    const popup = page.getByRole("dialog");
    await expect(popup).toHaveAttribute("data-side", "left");
    await settled(popup);
    const box = (await popup.boundingBox())!;
    const anchor = (await trigger.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(anchor.x);
  });
});

test.describe("Tooltip", () => {
  test("shows on hover after the delay and can be hovered itself", async ({
    page,
  }) => {
    await visit(page, "overlays-tooltip--default");
    const trigger = page.getByRole("button", { name: "Publish" });
    const tip = page.getByRole("tooltip");
    await trigger.hover();
    await expect(tip).toBeVisible();
    await settled(tip);
    const box = (await tip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 4,
    });
    await page.waitForTimeout(250);
    await expect(tip).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(tip).toBeHidden();
  });

  test("shows on keyboard focus, hides on Escape, and describes the trigger", async ({
    page,
  }) => {
    await visit(page, "overlays-tooltip--default");
    await page.keyboard.press("Tab");
    const trigger = page.getByRole("button", { name: "Publish" });
    await expect(trigger).toBeFocused();
    const tip = page.getByRole("tooltip");
    await expect(tip).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription(
      "Visible to your whole team",
    );
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("long text stays on a 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 400 });
    await visit(page, "overlays-tooltip--long-text");
    await page.keyboard.press("Tab");
    const tip = page.getByRole("tooltip");
    await settled(tip);
    await inViewport(page, tip);
  });
});

test.describe("DropdownMenu", () => {
  test("runs the keyboard pattern end to end", async ({ page }) => {
    await visit(page, "overlays-dropdownmenu--default");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    const item = (name: string) => page.getByRole("menuitem", { name });
    await expect(item("Rename")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item("Duplicate")).toBeFocused();
    await page.keyboard.press("End");
    await expect(item("Delete")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item("Rename")).toBeFocused();
    await page.keyboard.press("a");
    await expect(item("Archive")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(item("Archive")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(item("Rename")).toBeHidden();
    await expect(page.getByRole("button", { name: "Actions" })).toBeFocused();
  });

  test("a pointer opens it on the menu itself, and hover highlights rows", async ({
    page,
  }) => {
    await visit(page, "overlays-dropdownmenu--default");
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(page.getByRole("menu")).toBeFocused();
    await page.getByRole("menuitem", { name: "Duplicate" }).hover();
    await expect(
      page.getByRole("menuitem", { name: "Duplicate" }),
    ).toBeFocused();
  });

  test("an item can open a Dialog, and focus returns to the trigger after", async ({
    page,
  }) => {
    await visit(page, "overlays-dropdownmenu--opens-a-dialog");
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a long list scrolls and stays on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 400 });
    await visit(page, "overlays-dropdownmenu--long-list-narrow");
    await page.getByRole("button", { name: "Actions" }).click();
    const menu = page.getByRole("menu");
    await settled(menu);
    await inViewport(page, menu);
    await page.keyboard.press("End");
    await expect(
      page.getByRole("menuitem", { name: "Workspace number 30" }),
    ).toBeInViewport();
  });
});

test.describe("Tabs", () => {
  test("the indicator sits under the selected tab, in both directions", async ({
    page,
  }) => {
    for (const id of ["default", "right-to-left"]) {
      await visit(page, `navigation-tabs--${id}`);
      const tabs = page.getByRole("tab");
      await tabs.nth(1).click();
      const indicator = page.locator(".prava-tabs__indicator");
      await settled(indicator);
      const bar = (await indicator.boundingBox())!;
      const tab = (await tabs.nth(1).boundingBox())!;
      expect(Math.abs(bar.x - tab.x)).toBeLessThan(1);
      expect(Math.abs(bar.width - tab.width)).toBeLessThan(1);
      expect(Math.abs(bar.y + bar.height - (tab.y + tab.height))).toBeLessThan(
        1,
      );
    }
  });

  test("slides between tabs and doesn't animate on load", async ({ page }) => {
    await visit(page, "navigation-tabs--default");
    const indicator = page.locator(".prava-tabs__indicator");
    expect(await indicator.evaluate((el) => el.getAnimations().length)).toBe(0);
    const runs = await recordTransitions(page, ".prava-tabs__indicator");
    await page.getByRole("tab", { name: "Billing" }).click();
    await runs().toContain("translate");
  });

  test("arrow keys mirror in RTL", async ({ page }) => {
    await visit(page, "navigation-tabs--right-to-left");
    const tabs = page.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("every tab stays reachable by keyboard when they overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 400 });
    await visit(page, "navigation-tabs--scrolls-when-narrow");
    const tabs = page.getByRole("tab");
    await tabs.first().focus();
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await expect(tabs.last()).toBeInViewport();
    const hasPageOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasPageOverflow).toBe(false);
  });
});

test.describe("Accordion", () => {
  test("closed panels are out of the tab order and hidden from assistive tech", async ({
    page,
  }) => {
    await visit(page, "navigation-accordion--default");
    const exportHeader = page.getByRole("button", {
      name: "Can I export my data?",
    });
    const startExport = page.getByRole("button", {
      name: "Start export",
      includeHidden: false,
    });
    await expect(startExport).toHaveCount(0);
    await exportHeader.focus();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement?.textContent ?? ""),
    ).not.toBe("Start export");

    await exportHeader.click();
    await expect(startExport).toBeVisible();
    await exportHeader.focus();
    await page.keyboard.press("Tab");
    await expect(startExport).toBeFocused();
  });

  test("animates to the content's height, and not for reduced motion", async ({
    page,
  }) => {
    await visit(page, "navigation-accordion--default");
    const header = page.getByRole("button", {
      name: "Can I change the number of seats?",
    });
    const runs = await recordTransitions(page, ".prava-accordion__panel");
    await header.click();
    const panel = page.locator(".prava-accordion__panel").nth(1);
    await runs().toContain("grid-template-rows");
    await settled(panel);
    await expect(page.getByText("Changes apply straight away")).toBeVisible();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await header.click();
    expect(await panel.evaluate((el) => el.getAnimations().length)).toBe(0);
  });
});

test.describe("Toast", () => {
  test("appears, is pressable while the page stays clickable, and dismisses", async ({
    page,
  }) => {
    await visit(page, "feedback-toast--default");
    await page.getByRole("button", { name: "Success" }).click();
    const list = page.locator(".prava-toaster__list");
    await expect(list).toContainText("Invitation sent");
    await expect(
      page.locator('[role="status"].prava-toaster__announce'),
    ).toContainText("Invitation sent");
    const toast = page.locator(".prava-toast");
    await settled(toast);
    await inViewport(page, toast);
    await page.getByRole("button", { name: "Success" }).click();
    await expect(toast).toHaveCount(2);
    await page
      .getByRole("button", { name: "Dismiss", exact: true })
      .first()
      .click();
    await expect(toast).toHaveCount(1);
  });

  test("danger stays and announces urgently; hover pauses timers", async ({
    page,
  }) => {
    await visit(page, "feedback-toast--default");
    await page.getByRole("button", { name: "Danger" }).click();
    await expect(
      page.locator('[role="alert"].prava-toaster__announce'),
    ).toContainText("Payment failed");
    await page.waitForTimeout(5500);
    await expect(page.locator(".prava-toast")).toHaveCount(1);
  });

  test("re-enters the top layer after a modal Dialog opened", async ({
    page,
  }) => {
    await visit(page, "feedback-toast--default");
    await page.evaluate(() => {
      const dialog = document.createElement("dialog");
      dialog.textContent = "modal";
      document.body.append(dialog);
      dialog.showModal();
      // The modal makes the page inert to the pointer, so press from script.
      Array.from(document.querySelectorAll("button"))
        .find((b) => b.textContent === "Neutral")!
        .click();
    });
    await expect(page.locator(".prava-toast")).toHaveCount(1);
    await expect(page.locator(".prava-toaster")).toHaveJSProperty(
      "popover",
      "manual",
    );
    expect(
      await page
        .locator(".prava-toaster")
        .evaluate((el) => el.matches(":popover-open")),
    ).toBe(true);
  });

  test("fits a 320px screen and mirrors to the start edge in RTL", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 500 });
    await visit(page, "feedback-toast--right-to-left");
    await page.getByRole("button", { name: "إرسال" }).click();
    const region = page.locator(".prava-toaster");
    await settled(page.locator(".prava-toast"));
    await inViewport(page, region);
    const box = (await region.boundingBox())!;
    expect(box.x).toBe(16);
  });
});

test.describe("Grid", () => {
  test("caps at the requested columns at many widths, then collapses to one", async ({
    page,
  }) => {
    await visit(page, "layout-grid--three-columns");
    const cards = page.locator(".prava-grid > *");
    const columns = () =>
      cards.evaluateAll(
        (els) =>
          new Set(els.map((el) => Math.round(el.getBoundingClientRect().x)))
            .size,
      );
    for (const width of [1400, 1280, 1111, 1024, 999, 777, 641]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await columns(), `at ${width}px`).toBe(3);
    }
    await page.setViewportSize({ width: 320, height: 800 });
    expect(await columns()).toBe(1);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});

test("Alert wraps its action and keeps the dismiss button in the corner", async ({
  page,
}) => {
  await visit(page, "feedback-alert--long-text-narrow");
  const alert = page.locator(".prava-alert");
  const root = (await alert.boundingBox())!;
  const dismiss = (await page
    .getByRole("button", { name: "Dismiss" })
    .boundingBox())!;
  const body = (await page.locator(".prava-alert__body").boundingBox())!;
  const action = (await page.locator(".prava-alert__action").boundingBox())!;
  expect(dismiss.y - root.y).toBeLessThan(12);
  expect(root.x + root.width - (dismiss.x + dismiss.width)).toBeLessThan(12);
  expect(action.y).toBeGreaterThanOrEqual(body.y + body.height);
  expect(body.x + body.width).toBeLessThanOrEqual(dismiss.x);
});
