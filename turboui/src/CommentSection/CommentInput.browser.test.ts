import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("opening a comment at the bottom of a long page brings the editor and its actions into view", async () => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "pages-taskpage--long-content");
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);

  const trigger = page.locator('[data-test-id="add-comment"]');
  await trigger.evaluate((element) => element.scrollIntoView({ block: "end" }));
  await trigger.click();

  const composer = page.locator('[data-test-id="new-comment-form"]');
  await composer.locator('[contenteditable="true"]:focus').waitFor();
  const visible = await composer.evaluate(
    (element) =>
      new Promise<boolean>((resolve) => {
        const observer = new IntersectionObserver(([entry]) => {
          observer.disconnect();
          // Chromium can round the scroll position to a whole pixel.
          resolve(!!entry && entry.boundingClientRect.height - entry.intersectionRect.height <= 1);
        });
        observer.observe(element);
      }),
  );
  assert.ok(visible, "The full composer should be in view without scrolling again");
});
