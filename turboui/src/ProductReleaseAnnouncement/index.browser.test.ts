import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

function storyUrl(story: string) {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", `components-productreleaseannouncement--${story}`);
  url.searchParams.set("viewMode", "story");
  return url.href;
}

async function layout() {
  return page.locator('[data-test-id="product-release-toast"]').evaluate((toast) => {
    const title = toast.querySelector("p:nth-of-type(2)");
    const link = toast.querySelector('[data-test-id="product-release-read-more"]');
    const dismiss = toast.querySelector('[data-test-id="product-release-toast-dismiss"]');
    const icon = toast.querySelector("svg[aria-hidden='true']");
    const content = toast.firstElementChild?.firstElementChild;
    if (!title || !link || !dismiss || !icon?.parentElement || !content) {
      throw new Error("Release announcement is incomplete");
    }

    const titleStyle = getComputedStyle(title);
    const bounds = toast.getBoundingClientRect();
    const linkBounds = link.getBoundingClientRect();
    const dismissBounds = dismiss.getBoundingClientRect();
    return {
      bounds: { left: bounds.left, right: bounds.right, bottom: bounds.bottom, height: bounds.height },
      linkBounds: { left: linkBounds.left, right: linkBounds.right, top: linkBounds.top, bottom: linkBounds.bottom },
      dismissBounds: { left: dismissBounds.left, right: dismissBounds.right, top: dismissBounds.top, bottom: dismissBounds.bottom },
      titleLines: title.getBoundingClientRect().height / parseFloat(titleStyle.lineHeight),
      titleClamp: titleStyle.webkitLineClamp,
      iconDisplay: getComputedStyle(icon.parentElement).display,
      padding: getComputedStyle(content).paddingTop,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

function assertControlsFit(result: Awaited<ReturnType<typeof layout>>, width: number) {
  assert.ok(result.bounds.left >= 0 && result.bounds.right <= width);
  assert.ok(!result.horizontalOverflow);
  for (const control of [result.linkBounds, result.dismissBounds]) {
    assert.ok(control.left >= result.bounds.left && control.right <= result.bounds.right);
    assert.ok(control.top >= result.bounds.bottom - result.bounds.height && control.bottom <= result.bounds.bottom);
    assert.ok(control.right > control.left && control.bottom > control.top);
  }
}

describe("product release announcement in a browser", () => {
  test("uses at most 120 pixels at 374px with the long release title", async () => {
    await page.setViewportSize({ width: 374, height: 812 });
    await page.goto(storyUrl("compact"));

    const result = await layout();
    assertControlsFit(result, 374);
    assert.ok(result.bounds.height <= 120, `Toast height: ${result.bounds.height}px`);
    assert.ok(result.titleLines <= 2.1, `Visible title lines: ${result.titleLines}`);
    assert.equal(result.titleClamp, "2");
    assert.equal(result.bounds.bottom, 812 - 16);
    assert.equal(result.iconDisplay, "none");
  });

  test("fits at 320px with translated controls and a long title", async () => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(storyUrl("compact-portuguese"));

    const result = await layout();
    assertControlsFit(result, 320);
    assert.ok(
      result.linkBounds.right < result.dismissBounds.left ||
        result.linkBounds.bottom <= result.dismissBounds.top ||
        result.dismissBounds.bottom <= result.linkBounds.top,
    );
    assert.equal(await page.getByRole("link", { name: "Ver versão" }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Dispensar" }).count(), 1);
  });

  test.each([640, 1280])("keeps desktop layout at %ipx", async (width) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(storyUrl("toast"));

    const result = await layout();
    assertControlsFit(result, width);
    assert.equal(result.titleClamp, "3");
    assert.equal(result.iconDisplay, "flex");
    assert.equal(result.padding, "16px");
    assert.equal(result.bounds.bottom, 812 - 24);
    assert.equal(result.bounds.right, width - 24);
    assert.equal(result.bounds.right - result.bounds.left, 384);
  });

  test("keeps both controls keyboard reachable and dismisses the story", async () => {
    await page.setViewportSize({ width: 374, height: 812 });
    await page.goto(storyUrl("compact"));
    const link = page.getByRole("link", { name: "View release" });
    const dismiss = page.getByRole("button", { name: "Dismiss" });
    for (let tab = 0; tab < 10 && !(await link.evaluate((element) => element === document.activeElement)); tab++) {
      await page.keyboard.press("Tab");
    }
    assert.ok(await link.evaluate((element) => element === document.activeElement));
    assert.equal(await link.getAttribute("href"), "https://operately.com/releases/");
    assert.equal(await link.getAttribute("target"), "_blank");
    await page.keyboard.press("Tab");
    assert.ok(await dismiss.evaluate((element) => element === document.activeElement));
    await page.keyboard.press("Enter");
    assert.equal(await page.locator('[data-test-id="product-release-toast"]').count(), 0);
  });
});
