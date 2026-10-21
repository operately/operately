import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("checklist add and edit fields enforce the name limit", async () => {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "components-checklist--default");
  await page.goto(url.href);

  await page.locator('[data-test-id="add-checklist-item"]').click();
  const nameInput = page.locator('input[name="name"]');
  const name = "č".repeat(2000);
  await nameInput.fill(name);
  await nameInput.press("End");
  await nameInput.press("x");
  assert.equal(await nameInput.inputValue(), name);
  await page.locator('[data-test-id="save"]').click();
  const itemName = page.getByText(name, { exact: true });
  await itemName.waitFor();
  const item = itemName.locator("..");
  await item.hover();
  await item.locator('[data-test-id^="checklist-item-menu-"]').click();
  await item.locator('[data-test-id="edit"]').click();
  assert.equal(await nameInput.inputValue(), name);
  await nameInput.press("End");
  await nameInput.press("x");
  assert.equal(await nameInput.inputValue(), name);
  await nameInput.fill("Updated checklist name");
  await page.locator('[data-test-id="save"]').click();
  await page.getByText("Updated checklist name", { exact: true }).waitFor();
});
