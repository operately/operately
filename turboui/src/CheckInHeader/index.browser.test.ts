import assert from "node:assert/strict";
import type { Page } from "playwright";
import { waitForPageReady } from "@storybook/test-runner";

declare const page: Page;
const headingSelector = '[data-test-id="check-in-paper-preview"] h1';

async function visit(state: "published" | "draft" | "scheduled") {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", `components-checkinheader--paper-${state}`);
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);
  await page.locator('[data-test-id="check-in-paper-preview"]').waitFor();
  await waitForPageReady(page);
}

async function titleParts() {
  return page.locator(headingSelector).evaluate((heading) =>
    [...heading.children].flatMap((part) => {
      const range = document.createRange();
      range.selectNodeContents(part);
      return [...range.getClientRects()].map((rect) => ({
        left: rect.left,
        right: rect.right,
      }));
    }),
  );
}

test.each(["published", "draft", "scheduled"] as const)(
  "%s check-in title and badge clear the menu at narrow widths",
  async (state) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await visit(state);

      const menu = await page.locator('[data-test-id="check-in-options"]').boundingBox();
      const paper = await page.locator('[data-test-id="check-in-paper-preview"]').boundingBox();
      const heading = await page.locator(headingSelector).boundingBox();
      const parts = await titleParts();
      assert.ok(menu && paper && heading && parts.length > 0);
      assert.ok(Math.abs(heading.x + heading.width / 2 - (paper.x + paper.width / 2)) <= 1);

      for (const part of parts) {
        assert.ok(part.left >= heading.x, `Title extends beyond the heading at ${width}px`);
        assert.ok(part.right <= heading.x + heading.width, `Title is clipped at ${width}px`);
        assert.ok(part.right <= menu.x, `Title reaches the menu at ${width}px`);
      }

      if (width === 320) {
        const wraps = await page
          .locator(`${headingSelector} > span`)
          .first()
          .evaluate((title) => {
            const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
            return title.getBoundingClientRect().height > lineHeight;
          });
        assert.ok(wraps, "The date title should wrap at 320px");
      }

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
  },
);

test("desktop title remains centered beside the outside Edit action", async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await visit("published");

  const paper = await page.locator('[data-test-id="check-in-paper-preview"]').boundingBox();
  const heading = await page.locator(headingSelector).boundingBox();
  const edit = await page.locator('[data-test-id="check-in-edit"]').boundingBox();
  const menu = await page.locator('[data-test-id="check-in-options"]').boundingBox();
  assert.ok(paper && heading && edit && menu);
  assert.ok(Math.abs(heading.x + heading.width / 2 - (paper.x + paper.width / 2)) <= 1);
  assert.ok(heading.x + heading.width <= edit.x);
  assert.ok(edit.x + edit.width <= menu.x);
});
