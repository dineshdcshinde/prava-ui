import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const open = async (page: Page, story: string, width = 1024) => {
  await page.setViewportSize({ width, height: 720 });
  await page.goto(
    `/iframe.html?id=navigation-pagination--${story}&viewMode=story`,
  );
  await expect(page.locator(".prava-pagination").first()).toBeVisible();
};

test("works from the keyboard and keeps focus at the end of the range", async ({
  page,
}) => {
  await open(page, "default");
  const nav = page.getByRole("navigation", { name: "Pagination" });
  const previous = nav.getByRole("button", { name: "Previous page" });
  await page.keyboard.press("Tab");
  await expect(previous).toBeFocused();
  // A visible ring, not just focus.
  await expect
    .poll(() => previous.evaluate((el) => getComputedStyle(el).outlineColor))
    .not.toBe("rgba(0, 0, 0, 0)");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const four = nav.getByRole("button", { name: "Go to page 4" });
  await expect(four).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(four).toHaveAttribute("aria-current", "page");
  await expect(four).toBeFocused();

  await nav.getByRole("button", { name: "Go to page 20" }).click();
  const next = nav.getByRole("button", { name: "Next page" });
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await nav.getByRole("button", { name: "Go to page 19" }).click();
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await expect(next).toBeFocused();
});

test("links navigate and mark the new page", async ({ page }) => {
  await open(page, "links");
  const six = page.getByRole("link", { name: "Go to page 6" });
  await six.click();
  await expect(page).toHaveURL(/#page-6$/);
  await expect(six).toHaveAttribute("aria-current", "page");
});

test("single page shows one current number between disabled arrows", async ({
  page,
}) => {
  await open(page, "single-page");
  await expect(
    page.getByRole("button", { name: "Go to page 1" }),
  ).toHaveAttribute("aria-current", "page");
  for (const name of ["Previous page", "Next page"]) {
    await expect(page.getByRole("button", { name })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
});

test("visible numbers follow the container and the arrows always stay", async ({
  page,
}) => {
  await open(page, "narrow-containers");
  for (const [width, text] of [
    [560, "1 … 4 5 6 … 20"],
    [400, "1 … 5 … 20"],
    [288, "1 … 5 … 20"],
    [240, "5"],
  ] as const) {
    const box = page.getByTestId(`width-${width}`);
    const visible = box.locator("li:visible");
    expect((await visible.allInnerTexts()).filter(Boolean).join(" ")).toBe(
      text,
    );
    await expect(
      box.getByRole("button", { name: "Previous page" }),
    ).toBeVisible();
    await expect(box.getByRole("button", { name: "Next page" })).toBeVisible();
    const rows = await visible.evaluateAll(
      (items) =>
        new Set(
          items.map((item) => {
            const { top, height } = item.getBoundingClientRect();
            return Math.round(top + height / 2);
          }),
        ).size,
    );
    expect(rows, `single row at ${width}px`).toBe(1);
  }
});

test("a compact layout marks jumps the wide layout does not have", async ({
  page,
}) => {
  await open(page, "narrow-containers");
  const box = page.getByTestId("width-288");
  await box.getByRole("button", { name: "Previous page" }).click();
  await expect
    .poll(async () =>
      (await box.locator("li:visible").allInnerTexts())
        .filter(Boolean)
        .join(" "),
    )
    .toBe("1 … 4 … 20");
});

for (const story of ["default", "links", "more-siblings", "rtl"]) {
  test(`${story} fits a 320px viewport`, async ({ page }) => {
    await open(page, story, 320);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.locator("li:visible .prava-pagination__icon"),
    ).toHaveCount(2);
  });
}

test("RTL runs right to left, mirrors arrows and uses the locale", async ({
  page,
}) => {
  await open(page, "rtl");
  const nav = page.getByRole("navigation", { name: "ترقيم الصفحات" });
  const previous = nav.getByRole("button", { name: "الصفحة السابقة" });
  const next = nav.getByRole("button", { name: "الصفحة التالية" });
  expect((await previous.boundingBox())!.x).toBeGreaterThan(
    (await next.boundingBox())!.x,
  );
  await expect(previous.locator("svg")).toHaveCSS("scale", "-1 1");
  await expect(
    nav.getByRole("button", { name: "انتقل إلى الصفحة ٥" }),
  ).toHaveText("٥");
  await next.click();
  await expect(
    nav.getByRole("button", { name: "انتقل إلى الصفحة ٦" }),
  ).toHaveAttribute("aria-current", "page");
});

test("default renders in light and dark", async ({ page }) => {
  await open(page, "default");
  const current = page.getByRole("button", { name: "Go to page 5" });
  const fill = () =>
    current.evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await fill();
  await page.screenshot({
    path: join(tmpdir(), "prava-pagination-light.png"),
    clip: { x: 0, y: 0, width: 520, height: 80 },
  });

  await page.goto(
    "/iframe.html?id=navigation-pagination--default&viewMode=story&globals=theme:dark",
  );
  await expect(current).toBeVisible();
  await expect(page.locator(".prava-provider")).toHaveAttribute(
    "data-prava-theme",
    "dark",
  );
  await expect.poll(fill).not.toBe(light);
  await page.screenshot({
    path: join(tmpdir(), "prava-pagination-dark.png"),
    clip: { x: 0, y: 0, width: 520, height: 80 },
  });
});
