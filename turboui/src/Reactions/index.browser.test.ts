import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

describe("reaction picker in a browser", () => {
  beforeEach(async () => {
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", "components-reactions--interactive");
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);
    await page.locator('[aria-haspopup="dialog"]').waitFor();
  });

  test("opens, searches, selects with Enter and Space, and closes using only the keyboard", async () => {
    const trigger = page.locator('[aria-haspopup="dialog"]');
    const dialog = page.getByRole("dialog");
    const search = page.getByRole("textbox");

    await page.keyboard.press("Tab");
    await assertFocused(trigger);
    await page.keyboard.press("Enter");
    await assertFocused(search);
    await page.keyboard.type("salute");
    await page.keyboard.press("Enter");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await page.locator("[data-reaction-item]").count(), 4);
    await assertFocused(trigger);

    await page.keyboard.press("Space");
    await assertFocused(search);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await assertFocused(page.locator('[data-test-id="reaction-❤️-button"]'));
    await page.keyboard.press("Space");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await page.locator("[data-reaction-item]").count(), 5);
    await assertFocused(trigger);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await assertFocused(page.locator('[data-test-id="reaction-👍-button"]'));
    await page.keyboard.press("Enter");
    await dialog.waitFor({ state: "detached" });
    assert.equal(await page.locator("[data-reaction-item]").count(), 6);
    await assertFocused(trigger);

    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    await assertFocused(trigger);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await dialog.waitFor({ state: "detached" });
    await assertFocused(trigger);
  });

  test("scrolls the focused emoji into view and leaves the grid with one Tab", async () => {
    const trigger = page.locator('[aria-haspopup="dialog"]');
    await trigger.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    const grid = page.getByRole("grid");
    const rows = await grid.getByRole("row").count();
    for (let row = 1; row < rows; row++) await page.keyboard.press("ArrowDown");
    const focused = grid.locator("button:focus");
    const visible = await focused.evaluate((button) => {
      const scroller = button.closest('[role="grid"]')?.parentElement;
      if (!scroller) throw new Error("Emoji scroller missing");
      const bounds = button.getBoundingClientRect();
      const viewport = scroller.getBoundingClientRect();
      return scroller.scrollTop > 0 && bounds.top >= viewport.top && bounds.bottom <= viewport.bottom;
    });
    assert.ok(visible);
    assert.equal(await grid.locator('button[tabindex="0"]').count(), 1);
    await page.keyboard.press("Tab");
    await assertFocused(page.getByRole("dialog").getByRole("button").first());
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(await page.locator("[data-reaction-item]").count(), 3);
  });
});

async function assertFocused(locator: Locator) {
  await locator.waitFor();
  assert.ok(await locator.evaluate((element) => element.matches(":focus")));
}
