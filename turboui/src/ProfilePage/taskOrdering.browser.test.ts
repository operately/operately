import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("personal tasks can be dragged", async () => {
  page.setDefaultTimeout(10000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "pages-profilepage--reorder-tasks");
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);
  const rows = page.locator('tbody > tr[draggable="true"]');
  await rows.first().waitFor();
  const original = await rows.evaluateAll((elements) => elements.map((row) => row.getAttribute("data-test-id")));
  assert.ok(original.length >= 3);
  const target = rows.nth(2);
  const bounds = await target.boundingBox();
  const handle = await rows.first().locator('[data-test-id^="drag-task-"]').boundingBox();
  assert.ok(bounds && handle);
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height + 10, { steps: 5 });
  await page.mouse.move(bounds.x + 100, bounds.y + bounds.height - 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForFunction(
    (expected) => document.querySelector('tbody > tr[draggable="true"]')?.getAttribute("data-test-id") === expected,
    original[1],
  );
  const moved = await rows.evaluateAll((elements) => elements.map((row) => row.getAttribute("data-test-id")));
  assert.equal(moved[2], original[0]);

  if (process.env.SCREENSHOTS_DIR) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${process.env.SCREENSHOTS_DIR}/personal-task-ordering.png` });
  }
});
