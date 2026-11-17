import assert from "node:assert/strict";
import type { Page } from "playwright";
import { waitForPageReady } from "@storybook/test-runner";

declare const page: Page;

describe("Board height in a browser", () => {
  test("preserves viewport sizing for boards that do not opt in", async () => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", "components-taskboard-kanban--empty-states");
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);
    await waitForPageReady(page);

    const scrollBounds = await page.locator('[data-test-id="kanban-scroll-container"]').boundingBox();
    const columnBounds = await page.locator("[data-color-mode]").first().boundingBox();
    assert.ok(scrollBounds);
    assert.ok(columnBounds);
    assert.ok(Math.abs(scrollBounds.height - (1200 * 0.8 - 52)) <= 1);
    assert.ok(Math.abs(columnBounds.height - 1200 * 0.72) <= 1);
  });

  test.each([
    ["pages-spacekanbanpage--empty", 1280, 600],
    ["pages-spacekanbanpage--empty", 1280, 1200],
    ["pages-spacekanbanpage--empty", 390, 844],
    ["pages-spacekanbanpage--default", 1280, 600],
  ] as const)("fills the available page in %s at %i × %i", async (story, width, height) => {
    await page.setViewportSize({ width, height });
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", story);
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);
    await waitForPageReady(page);
    await page.locator('[data-test-id="kanban-columns"]').waitFor();

    const scrollContainer = page.locator('[data-test-id="kanban-scroll-container"]');
    const scrollBounds = await scrollContainer.boundingBox();
    assert.ok(scrollBounds);
    assert.ok(Math.abs(scrollBounds.y + scrollBounds.height - height) <= 1);

    const bounds = await page.locator('[data-test-id="kanban-columns"]').evaluate((row) => {
      const columns = [...row.querySelectorAll("[data-color-mode]")];
      return {
        bottom: row.getBoundingClientRect().bottom,
        columns: columns.map((column) => column.getBoundingClientRect().bottom),
        documentHeight: document.documentElement.scrollHeight,
      };
    });

    assert.ok(bounds.bottom >= height - 13, JSON.stringify(bounds));
    if (story === "pages-spacekanbanpage--empty") {
      assert.ok(Math.abs(bounds.bottom - (height - 12)) <= 1, JSON.stringify(bounds));
    }
    assert.ok(bounds.columns.every((bottom) => Math.abs(bottom - bounds.bottom) <= 1));
    assert.ok(bounds.documentHeight <= height, "The page should not scroll when the board fits");

    if (story !== "pages-spacekanbanpage--empty") {
      const scroll = await scrollContainer.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        return { top: element.scrollTop, height: element.clientHeight, contentHeight: element.scrollHeight };
      });
      assert.ok(scroll.top > 0, "A populated board must scroll to reach the remaining tasks");
      assert.equal(scroll.top + scroll.height, scroll.contentHeight);
    }
  });
});

describe("Board column colors in a browser", () => {
  test.each([
    [1280, "light"],
    [1280, "dark"],
    [390, "light"],
    [390, "dark"],
  ] as const)(
    "selects each mode at %i pixels wide in %s mode",
    async (width, theme) => {
      page.setDefaultTimeout(5000);
      await page.setViewportSize({ width, height: 900 });
      const url = new URL("iframe.html", process.env.TARGET_URL);
      url.searchParams.set("id", "components-taskboard-kanban--soft-column-colors");
      url.searchParams.set("viewMode", "story");
      url.searchParams.set("globals", `theme:${theme}`);
      await page.goto(url.href);
      await waitForPageReady(page);
      await page.waitForFunction((expectedTheme) => document.body.classList.contains(expectedTheme), theme);

      const display = page.locator('[data-test-id="display-menu-trigger"]');
      const columns = page.locator("[data-color-mode]");
      try {
        await display.waitFor();
      } catch (error) {
        throw new Error(`Board did not render: ${await page.locator("body").innerText()}`, { cause: error });
      }
      assert.equal(await columns.first().getAttribute("data-color-mode"), "soft");

      let selectedMode = "soft";
      for (const mode of ["vivid", "bordered", "none", "soft"]) {
        await display.click();
        await page.locator('[data-test-id="display-menu"]').waitFor();
        // Exercise color settings without depending on pointer travel between desktop flyout menus.
        if (width >= 640) await page.getByRole("menuitem", { name: /Column colors/ }).press("ArrowRight");

        const selectedOption = page.locator(`[data-test-id="column-colors-${selectedMode}"]`);
        assert.equal(await selectedOption.getAttribute("aria-checked"), "true");
        const option = page.locator(`[data-test-id="column-colors-${mode}"]`);
        if (width >= 640) await option.press("Enter");
        else await option.click();
        await page.waitForFunction(
          (expectedMode) =>
            [...document.querySelectorAll("[data-color-mode]")].every(
              (column) => column.getAttribute("data-color-mode") === expectedMode,
            ),
          mode,
        );
        selectedMode = mode;

        await page.locator('[data-test-id="display-menu-trigger"][data-state="closed"]').waitFor();
        await page.locator('[data-test-id="display-menu"]').waitFor({ state: "detached" });
        await page.waitForFunction(
          () => document.activeElement?.getAttribute("data-test-id") === "display-menu-trigger",
        );

        if (process.env.SCREENSHOTS_DIR && width === 1280) {
          await page.screenshot({ path: `${process.env.SCREENSHOTS_DIR}/column-colors-${mode}-${theme}.png` });
        }
      }
    },
    30000,
  );
});
