import { expect, test } from "@playwright/test";

const story = (id: string) => `/iframe.html?id=readme-teampage--${id}&viewMode=story`;

test("README Team page: invite, validate, revoke", async ({ page }) => {
  await page.goto(story("default"));
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  await expect(page.getByText("aisha@acme.dev")).toBeVisible();

  const invite = page.getByRole("button", { name: "Invite people" });
  await invite.click();
  const dialog = page.getByRole("dialog", { name: "Invite a teammate" });
  await expect(dialog).toBeVisible();
  const email = dialog.getByRole("textbox", { name: "Work email" });
  await expect(email).toBeFocused();

  await email.fill("bob");
  await dialog.getByRole("button", { name: "Send invite" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Enter a valid email address.")).toBeVisible();

  await email.fill("bob@acme.dev");
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Invite sent", { exact: true })).toBeVisible();

  const pending = page.getByRole("tab", { name: /Pending/ });
  await expect(pending).toContainText("1");
  await pending.click();
  await expect(page.getByRole("tabpanel").getByText("bob@acme.dev")).toBeVisible();
  await page.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByText("No pending invites")).toBeVisible();

  await invite.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Work email" })).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(invite).toBeFocused();
});

test("README Team page: change role, remove, undo", async ({ page }) => {
  await page.goto(story("default"));
  const mei = page.locator(".prava-card", { hasText: "Mei Tanaka" });

  await mei.getByRole("button", { name: "Manage" }).click();
  await page.getByRole("menuitem", { name: "Editor" }).click();
  await expect(mei.locator(".prava-badge__indicator")).toHaveText("Editor");

  await mei.getByRole("button", { name: "Manage" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Editor" })).toBeDisabled();
  await page.getByRole("menuitem", { name: "Remove from team" }).click();
  await expect(page.getByText("mei@acme.dev")).toBeHidden();
  await expect(page.getByText("Mei Tanaka was removed", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("mei@acme.dev")).toBeVisible();
  await expect(page.getByText("Mei Tanaka was removed", { exact: true }).first()).toBeHidden();
});

test("README Team page: seats fill and RTL story renders", async ({ page }) => {
  await page.goto(story("default"));
  const invite = page.getByRole("button", { name: "Invite people" });
  for (const name of ["a", "b", "c", "d", "e"]) {
    await invite.click();
    await page.getByRole("textbox", { name: "Work email" }).fill(`${name}@acme.dev`);
    await page.getByRole("button", { name: "Send invite" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await expect(invite).toBeDisabled();
  await expect(page.getByRole("progressbar", { name: "Seats used" })).toHaveAttribute("aria-valuenow", "8");

  await page.goto(story("rtl"));
  await expect(page.locator(".prava-provider[lang=ar]")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
});
