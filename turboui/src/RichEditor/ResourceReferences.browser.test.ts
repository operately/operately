import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("shows matching work while typing in the shared editor", async () => {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "components-richeditor--resource-references");
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);

  const editor = page.locator('[contenteditable="true"]');
  await editor.click();
  await editor.press("End");
  await editor.type(" #Website");

  const project = page.locator('[data-test-id="mention-resource-project-project"]');
  await project.waitFor();
  assert.equal(await project.locator("span").first().textContent(), "Website launch");
});
