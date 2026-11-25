import assert from "node:assert/strict";
import type { Page } from "playwright";
import { assertTabsFit } from "./tabsBrowserAssertions";

declare const page: Page;

describe("Tabs in a browser", () => {
  test.each([320, 374, 768, 1280])("keeps project tabs readable at %ipx", async (width) => {
    await openStory(page, "components-tabs--project-overflow", width);
    const nav = page.locator("nav");

    await assertTabsFit(nav);
    assert.equal(await nav.locator(":scope > div").count(), 6);
    assert.equal((await nav.locator("a span").filter({ hasText: "4" }).count()) > 0, true);

    const rows = await nav
      .locator(":scope > div")
      .evaluateAll((items) => new Set(items.map((item) => Math.round(item.getBoundingClientRect().top))).size);
    if (width <= 374) assert.ok(rows > 1, "The project tabs should wrap on a narrow screen");
    if (width === 1280) {
      assert.equal(rows, 1, "The project tabs should remain on one row when they fit");
      const labelLines = await nav.locator("a > span:nth-child(2)").evaluateAll((labels) =>
        labels.map((label) => {
          const range = document.createRange();
          range.selectNodeContents(label);
          return range.getClientRects().length;
        }),
      );
      assert.ok(
        labelLines.every((lines) => lines === 1),
        "Desktop labels should remain on one line",
      );
    }
  });

  test.each([320, 374])("wraps an oversized translated label inside its tab at %ipx", async (width) => {
    await openStory(page, "components-tabs--oversized-label", width);
    await assertTabsFit(page.locator("nav"));

    const label = page.locator("nav a > span").filter({ hasText: "Dokumente & Dateien" });
    const lineCount = await label.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getClientRects().length;
    });
    assert.ok(lineCount > 1, "The long label should use more than one line");
  });

  test("preserves URL navigation, query parameters, and keyboard focus", async () => {
    await openStory(page, "components-tabs--project-overflow", 374);
    const discussions = page.locator('[data-test-id="tab-discussions"]');
    await discussions.click();
    assert.equal(await page.locator('[data-test-id="active-tab"]').textContent(), "discussions");
    const destination = new URL((await discussions.getAttribute("href")) ?? "", "http://localhost");
    assert.equal(destination.searchParams.get("tab"), "discussions");
    assert.equal(destination.searchParams.get("ref"), "storybook");

    await discussions.focus();
    await page.keyboard.press("Tab");
    const docs = page.locator('[data-test-id="tab-dokumente & dateien"]');
    assert.equal(await docs.evaluate((element) => document.activeElement === element), true);
    const outline = await docs.evaluate((element) => getComputedStyle(element).outlineStyle);
    assert.notEqual(outline, "none", "Keyboard focus should remain visible on wrapped rows");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator('[data-test-id="active-tab"]').textContent(), "docs-and-files");
  });

  test("preserves local onChange selection by click and keyboard", async () => {
    await openStory(page, "components-tabs--local-selection", 374);
    const profile = page.locator('[data-test-id="tab-profile"]');
    await profile.click();
    assert.equal(await page.locator('[data-test-id="active-tab"]').textContent(), "profile");

    const settings = page.locator('[data-test-id="tab-settings"]');
    await settings.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator('[data-test-id="active-tab"]').textContent(), "settings");
  });
});

async function openStory(page: Page, story: string, width: number) {
  await page.setViewportSize({ width, height: 720 });
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", story);
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);
  await page.locator("nav a, nav button").first().waitFor();
}
