import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

function storyUrl() {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "pages-projectcheckinformpage--create");
  url.searchParams.set("viewMode", "story");
  return url.href;
}

describe("new project check-in unload warning", () => {
  test("dismissing the native reload confirmation preserves text and status", async () => {
    page.setDefaultTimeout(5000);
    await page.goto(storyUrl());
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill("Progress that has not been submitted");
    const status = page.locator('[data-test-id="status-dropdown"]');
    await status.click();
    const option = page.locator('[data-test-id="status-dropdown-caution"]');
    const selectedStatus = await option.locator("p").textContent();
    await option.click();
    assert.equal(await status.locator("p").textContent(), selectedStatus);
    const currentUrl = page.url();

    const dialogPromise = page.waitForEvent("dialog");
    await page.evaluate(() => {
      // Start the reload without waiting for a navigation that choosing to stay cancels.
      window.setTimeout(() => window.location.reload(), 0);
    });
    const dialog = await dialogPromise;
    assert.equal(dialog.type(), "beforeunload");
    await dialog.dismiss();

    assert.equal(page.url(), currentUrl);
    assert.equal(await editor.textContent(), "Progress that has not been submitted");
    assert.equal(await status.locator("p").textContent(), selectedStatus);
  });
});
