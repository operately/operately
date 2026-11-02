import assert from "node:assert/strict";
import type { Page } from "playwright";
import { waitForPageReady } from "@storybook/test-runner";

declare const page: Page;

async function waitForMenuAnimations() {
  await page.getByRole("menu").evaluateAll(async (menus) => {
    await Promise.all(
      menus.flatMap((menu) =>
        menu
          .getAnimations()
          .filter((animation) => animation.playState === "running")
          .map((animation) => animation.finished),
      ),
    );
  });
}

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
        // Opening a submenu while its parent moves can dismiss it during pointer travel.
        await waitForMenuAnimations();

        if (width >= 640) await page.getByRole("menuitem", { name: /Column colors/ }).click();

        const selectedOption = page.locator(`[data-test-id="column-colors-${selectedMode}"]`);
        assert.equal(await selectedOption.getAttribute("aria-checked"), "true");
        await waitForMenuAnimations();

        await page.locator(`[data-test-id="column-colors-${mode}"]`).click();
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
