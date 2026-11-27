import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

function storyUrl(story: string) {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", `components-companynavigation--${story}`);
  url.searchParams.set("viewMode", "story");
  return url.href;
}

test("the pilot navbar shows the Work Map link with a hierarchy icon on desktop and mobile", async () => {
  await page.setViewportSize({ width: 1440, height: 805 });
  await page.goto(storyUrl("work-map-pilot"));

  const workMapIcon = page.getByRole("link", { name: "Work Map", exact: true }).locator("svg.tabler-icon-sitemap");
  await workMapIcon.waitFor();

  await page.setViewportSize({ width: 374, height: 812 });
  await page.getByRole("button", { name: "Navigation menu", exact: true }).click();
  await workMapIcon.waitFor();
});

async function assertExpanded(trigger: Locator, expanded: boolean) {
  await trigger
    .page()
    .waitForFunction(
      ({ expanded }) =>
        document.querySelector('[aria-label="Navigation menu"]')?.getAttribute("aria-expanded") === String(expanded),
      { expanded },
    );
  assert.equal(await trigger.getAttribute("aria-expanded"), String(expanded));
  assert.equal(await trigger.page().getByRole("link", { name: "My work", exact: true }).count(), expanded ? 1 : 0);
}

async function paddingPoint(trigger: Locator) {
  const button = await trigger.boundingBox();
  const icon = await trigger.locator("svg").boundingBox();
  assert.ok(button && icon);
  assert.equal(icon.width, 24);
  assert.equal(icon.height, 24);
  assert.equal(icon.x + icon.width, 374 - 16);
  const appearance = await trigger.evaluate((button) => {
    const style = getComputedStyle(button);
    return { background: style.backgroundColor, border: style.borderWidth };
  });
  assert.equal(appearance.background, "rgba(0, 0, 0, 0)");
  assert.equal(appearance.border, "0px");
  assert.ok(button.width > icon.width && button.height > icon.height);
  const point = { x: button.x + 4, y: button.y + 4 };
  assert.ok(point.x < icon.x && point.y < icon.y);
  return point;
}

async function assertMobileLayout(trigger: Locator) {
  const button = await trigger.boundingBox();
  assert.ok(button);
  assert.ok(button.x >= 0 && button.x + button.width <= 374);
  assert.ok(await trigger.page().evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  if ((await trigger.getAttribute("aria-expanded")) === "true") {
    const panel = await trigger
      .page()
      .getByRole("link", { name: "My work", exact: true })
      .evaluate((link) => {
        const bounds = link.parentElement?.getBoundingClientRect();
        if (!bounds) throw new Error("Navigation panel missing");
        return { top: bounds.top, bottom: bounds.bottom };
      });
    assert.ok(panel.top >= button.y + button.height);
    assert.ok(Math.abs(panel.bottom - (trigger.page().viewportSize()?.height ?? 0)) <= 1);
  }
}

describe("mobile navigation in a browser", () => {
  test("fits below an announcement banner and updates when the banner or viewport resizes", async () => {
    await page.setViewportSize({ width: 374, height: 812 });
    await page.goto(storyUrl("mobile-with-banner"));
    const trigger = page.getByRole("button", { name: "Navigation menu", exact: true });
    await trigger.click();
    await assertExpanded(trigger, true);
    await assertMobileLayout(trigger);
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight));

    await page.setViewportSize({ width: 374, height: 360 });
    await assertMobileLayout(trigger);
    const panel = page.getByRole("link", { name: "My work", exact: true }).locator("..");
    assert.ok(await panel.evaluate((element) => element.scrollHeight > element.clientHeight));
    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const lastItem = await panel.locator("div").last().boundingBox();
    assert.ok(lastItem && lastItem.y + lastItem.height <= 360);
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight));

    await page.locator('[data-test-id="announcement-banner"]').evaluate((banner) => {
      banner.style.height = "40px";
    });
    await page.waitForFunction(
      (panel) => panel && Math.abs(panel.getBoundingClientRect().bottom - window.innerHeight) <= 1,
      await panel.elementHandle(),
    );
    await assertMobileLayout(trigger);
  });

  test("opens and closes from real emulated touch taps outside the icon", async () => {
    const browser = page.context().browser();
    assert.ok(browser);
    const context = await browser.newContext({ viewport: { width: 374, height: 812 }, hasTouch: true, isMobile: true });
    try {
      const touchPage = await context.newPage();
      await touchPage.goto(storyUrl("long-company-name"));
      const trigger = touchPage.getByRole("button", { name: "Navigation menu", exact: true });
      await trigger.waitFor();
      const point = await paddingPoint(trigger);
      await touchPage.touchscreen.tap(point.x, point.y);
      await assertExpanded(trigger, true);
      await assertMobileLayout(trigger);
      await touchPage.touchscreen.tap(point.x, point.y);
      await assertExpanded(trigger, false);
    } finally {
      await context.close();
    }
  });

  test("Tab reaches the trigger with visible focus and Enter/Space each toggle it", async () => {
    await page.setViewportSize({ width: 374, height: 812 });
    await page.goto(storyUrl("default"));
    const trigger = page.getByRole("button", { name: "Navigation menu", exact: true });
    await trigger.waitFor();
    for (let tab = 0; tab < 3; tab++) await page.keyboard.press("Tab");
    assert.ok(await trigger.evaluate((button) => button.matches(":focus-visible")));
    assert.ok(await trigger.evaluate((button) => getComputedStyle(button).outlineStyle !== "none"));
    for (const key of ["Enter", "Space"]) {
      await page.keyboard.press(key);
      await assertExpanded(trigger, true);
      await assertMobileLayout(trigger);
      await page.keyboard.press(key);
      await assertExpanded(trigger, false);
      assert.ok(await trigger.evaluate((button) => button.matches(":focus-visible")));
    }
  });
});
