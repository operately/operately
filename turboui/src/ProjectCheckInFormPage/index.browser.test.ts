import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

function storyUrl() {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "pages-projectcheckinformpage--create");
  url.searchParams.set("viewMode", "story");
  return url.href;
}

describe("new project check-in local autosave", () => {
  test("reload restores text without a confirmation and later edits survive another reload", async () => {
    page.setDefaultTimeout(5000);
    await page.goto(storyUrl());
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill("Progress that has not been submitted");
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.accept();
    });
    await page.reload();
    await editor.waitFor();
    assert.equal(await editor.textContent(), "Progress that has not been submitted");
    await editor.fill("More progress after recovery");
    await page.reload();
    await editor.waitFor();
    assert.equal(await editor.textContent(), "More progress after recovery");
    assert.deepEqual(dialogs, []);
  });
});
