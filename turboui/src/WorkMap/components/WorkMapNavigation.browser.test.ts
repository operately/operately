import assert from "node:assert/strict";
import type { Page } from "playwright";
import { assertTabsFit } from "../../Tabs/tabsBrowserAssertions";

declare const page: Page;

describe("Work map navigation in a browser", () => {
  test.each([320, 374, 768, 1280])("keeps tabs and the view toggle accessible at %ipx", async (width) => {
    await page.setViewportSize({ width, height: 720 });
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", "components-workmapnavigation--narrow-layout");
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);

    const nav = page.locator("nav");
    await nav.locator("a").first().waitFor();
    await assertTabsFit(nav);
    assert.equal(await nav.locator(":scope > div").count(), 5);

    const toggle = page.getByRole("group", { name: "Work map view" });
    const bounds = await toggle.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1, "The view toggle must fit");
    assert.equal(await toggle.getByRole("link").count(), 2);
    const scrollAreas = await nav.evaluate((element) => {
      let parent = element.parentElement;
      let count = 0;
      while (parent && parent !== document.body) {
        if (parent.scrollWidth > parent.clientWidth + 1 && getComputedStyle(parent).overflowX === "auto") count++;
        parent = parent.parentElement;
      }
      return count;
    });
    assert.equal(scrollAreas, 0, "Navigation should not create a second scroll area");
  });

  test("keeps tab and view destinations usable", async () => {
    await page.setViewportSize({ width: 374, height: 720 });
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", "components-workmapnavigation--narrow-layout");
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);

    const goals = page.locator('[data-test-id="tab-goals"]');
    await goals.click();
    assert.match((await goals.getAttribute("href")) ?? "", /tab=goals/);
    const timeline = page.getByRole("group", { name: "Work map view" }).getByRole("link", { name: "Timeline" });
    await timeline.click();
    assert.equal(await timeline.getAttribute("aria-current"), "page");
    assert.match((await timeline.getAttribute("href")) ?? "", /view=timeline/);
  });
});
