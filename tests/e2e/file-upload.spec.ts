import { expect, test, type Page } from "@playwright/test";

const story = (id: string) =>
  `/iframe.html?id=forms-fileupload--${id}&viewMode=story`;
const picker = (page: Page) => page.locator(".prava-file-upload__input");
const txt = (name: string) => ({
  name,
  mimeType: "text/plain",
  buffer: Buffer.from("hello"),
});
const listed = (page: Page) => page.locator(".prava-file-upload__name");

const noOverflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

const dropFiles = (page: Page, files: { name: string; type: string }[]) =>
  page.locator(".prava-file-upload__dropzone").evaluate(async (zone, list) => {
    const dataTransfer = new DataTransfer();
    for (const { name, type } of list)
      dataTransfer.items.add(new File(["hello"], name, { type }));
    const fire = (type: string) =>
      zone.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
      );
    fire("dragenter");
    fire("dragover");
    // React renders the state from a native event in a later task.
    for (let i = 0; i < 25 && !zone.hasAttribute("data-dragging"); i += 1)
      await new Promise((resolve) => setTimeout(resolve, 20));
    const dragging = zone.hasAttribute("data-dragging");
    const notCancelled = fire("drop");
    return { dragging, notCancelled };
  }, files);

test("the keyboard opens the real file dialog and the file is listed", async ({
  page,
}) => {
  await page.goto(story("default"));
  const button = page.getByRole("button", {
    name: "Attachments Choose files",
  });
  await expect(button).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();

  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await chooser).setFiles(txt("a.txt"));
  await expect(listed(page)).toHaveText(["a.txt"]);

  // Focus moves to the remove button, then back to the chooser when the list empties.
  await page.keyboard.press("Tab");
  const remove = page.getByRole("button", { name: "Remove a.txt" });
  await expect(remove).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(listed(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("choosing the same file again still fires, after removing it too", async ({
  page,
}) => {
  await page.goto(story("default"));
  await picker(page).setInputFiles(txt("same.txt"));
  await expect(listed(page)).toHaveText(["same.txt"]);
  expect(await picker(page).evaluate((el: HTMLInputElement) => el.value)).toBe(
    "",
  );
  await picker(page).setInputFiles(txt("same.txt"));
  await expect(listed(page)).toHaveText(["same.txt", "same.txt"]);
  await page.getByRole("button", { name: "Remove same.txt" }).first().click();
  await page.getByRole("button", { name: "Remove same.txt" }).click();
  await expect(listed(page)).toHaveCount(0);
  await picker(page).setInputFiles(txt("same.txt"));
  await expect(listed(page)).toHaveText(["same.txt"]);
});

test("native submission sends exactly the listed files under name", async ({
  page,
}) => {
  await page.goto(story("in-native-form"));
  const send = page.getByRole("button", { name: "Send" });

  // Required, with nothing chosen: our message and focus, not a silent block.
  await send.click();
  await expect(page.locator(".prava-field__error")).toHaveText(
    "Fill in this field.",
  );
  await expect(
    page.getByRole("button", { name: /Choose files/ }),
  ).toBeFocused();

  await picker(page).setInputFiles([
    txt("a.txt"),
    txt("b.txt"),
    { name: "c.png", mimeType: "image/png", buffer: Buffer.from("x") },
  ]);
  await expect(listed(page)).toHaveText(["a.txt", "b.txt"]);
  await send.click();
  await expect(page.locator("output")).toHaveText("Sent: a.txt, b.txt");

  // A drop lands in the same form value.
  await dropFiles(page, [{ name: "d.txt", type: "text/plain" }]);
  await page.getByRole("button", { name: "Remove a.txt" }).click();
  await send.click();
  await expect(page.locator("output")).toHaveText("Sent: b.txt, d.txt");

  // The picker has no name, so it can't add a second entry; reset empties the real value.
  expect(
    await page.evaluate(
      () => document.querySelectorAll('input[type="file"][name]').length,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(listed(page)).toHaveCount(0);
  expect(
    await page
      .locator('input[name="attachments"]')
      .evaluate((el: HTMLInputElement) => el.files!.length),
  ).toBe(0);
});

test("a simulated drop is validated and announced, and the drag state shows", async ({
  page,
}) => {
  await page.goto(story("limits"));
  const result = await dropFiles(page, [
    { name: "photo.png", type: "image/png" },
    { name: "archive.zip", type: "application/zip" },
    { name: "doc.PDF", type: "" },
    { name: "extra.jpg", type: "image/jpeg" },
  ]);
  expect(result).toEqual({
    dragging: true,
    notCancelled: false,
  });
  await expect(listed(page)).toHaveText(["photo.png", "doc.PDF"]);
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("archive.zip isn't an accepted file type.");
  await expect(alert).toContainText("You can add up to 2 files.");
  await expect(
    page.locator(".prava-file-upload__dropzone"),
  ).not.toHaveAttribute("data-dragging");
});

test("an oversize file is refused with a formatted limit", async ({ page }) => {
  await page.goto(story("limits"));
  await picker(page).setInputFiles({
    name: "big.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(1024 * 1024 + 1),
  });
  await expect(page.getByRole("alert")).toHaveText(
    "big.pdf is larger than 1 MB.",
  );
  await expect(listed(page)).toHaveCount(0);
});

test("long file names wrap inside 320px with no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(story("long-file-names"));
  await expect(listed(page)).toHaveCount(2);
  expect(await noOverflow(page)).toBe(true);
  const item = (await page
    .locator(".prava-file-upload__item")
    .first()
    .boundingBox())!;
  const name = (await listed(page).first().boundingBox())!;
  expect(item.x + item.width).toBeLessThanOrEqual(320);
  expect(name.x + name.width).toBeLessThanOrEqual(item.x + item.width);
  expect(name.height).toBeGreaterThan(30);
  const remove = (await page
    .getByRole("button", { name: /^Remove quarterly/ })
    .boundingBox())!;
  expect(remove.width).toBeGreaterThanOrEqual(24);
  expect(remove.x + remove.width).toBeLessThanOrEqual(item.x + item.width);
});

test("RTL mirrors the layout and localizes rejections", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(story("rtl"));
  const button = page.getByRole("button", { name: "اختر الملفات" });
  const hint = page.locator(".prava-file-upload__hint");
  const buttonBox = (await button.boundingBox())!;
  expect((await hint.boundingBox())!.x).toBeLessThan(buttonBox.x);

  await picker(page).setInputFiles([
    txt("a.txt"),
    { name: "b.png", mimeType: "image/png", buffer: Buffer.from("x") },
  ]);
  await expect(page.getByRole("alert")).toContainText("b.png ليس نوع ملف");
  const item = (await page.locator(".prava-file-upload__item").boundingBox())!;
  const remove = (await page
    .getByRole("button", { name: "إزالة a.txt" })
    .boundingBox())!;
  const name = (await listed(page).boundingBox())!;
  expect(remove.x).toBeLessThan(name.x);
  expect(remove.x - item.x).toBeLessThan(16);
  expect(await noOverflow(page)).toBe(true);
});

test("light and dark render with the theme's tokens", async ({ page }) => {
  await page.setViewportSize({ width: 560, height: 360 });
  const dir = process.env.TEMP ?? ".";
  await page.goto(story("long-file-names"));
  await expect(listed(page)).toHaveCount(2);
  await page.screenshot({ path: `${dir}/prava-file-upload-light.png` });
  const lightBg = await page
    .locator(".prava-file-upload__dropzone")
    .evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.goto(`${story("long-file-names")}&globals=theme:dark`);
  await expect(listed(page)).toHaveCount(2);
  await expect(
    page.locator("[data-prava-theme='dark']").first(),
  ).toBeAttached();
  await page.screenshot({ path: `${dir}/prava-file-upload-dark.png` });
  const darkBg = await page
    .locator(".prava-file-upload__dropzone")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(darkBg).not.toBe(lightBg);
});

test("a disabled control refuses drops without letting the browser navigate", async ({
  page,
}) => {
  await page.goto(story("disabled"));
  await expect(
    page.getByRole("button", { name: "Attachments Choose files" }),
  ).toBeDisabled();
  const { notCancelled, dragging } = await dropFiles(page, [
    { name: "a.txt", type: "text/plain" },
  ]);
  expect(notCancelled).toBe(false);
  expect(dragging).toBe(false);
  await expect(listed(page)).toHaveCount(0);
});
