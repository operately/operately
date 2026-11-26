import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("the Work Map table fits the viewport and keeps progress tracks aligned", async () => {
  const url = new URL("iframe.html?id=pages-work-map-v2--active-work&viewMode=story", process.env.TARGET_URL);
  await page.goto(url.href);
  const table = page.getByRole("table");
  for (const [width, columns] of [
    [375, 3],
    [1024, 5],
    [1280, 7],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    await table
      .getByRole("columnheader")
      .nth(columns - 1)
      .waitFor();
    await table.getByRole("columnheader").nth(columns).waitFor({ state: "detached" });
    assert.ok(
      await table.evaluate((el) => {
        const container = el.parentElement;
        return container && container.scrollWidth <= container.clientWidth;
      }),
    );
    const trackWidths = await table
      .locator('[role="progress-bar"]')
      .evaluateAll((bars) => bars.map((bar) => bar.getBoundingClientRect().width));
    assert.ok(trackWidths.length > 1);
    assert.deepEqual([...new Set(trackWidths)], [70]);
  }
});
