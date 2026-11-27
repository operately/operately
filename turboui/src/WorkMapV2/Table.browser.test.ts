import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

test("Work Map status badges have a visible border", async () => {
  const url = new URL("iframe.html?id=pages-work-map-v2--active-work&viewMode=story", process.env.TARGET_URL);
  await page.goto(url.href);

  const badge = page.locator('[data-test-id="work-map-status"] > span').first();
  const { color, width } = await badge.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.borderTopColor, width: style.borderTopWidth };
  });

  assert.ok(parseFloat(width) > 0);
  assert.notEqual(color, "rgba(0, 0, 0, 0)");
});

test("phone filters stay in one toolbar row as selections change", async () => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(new URL("iframe.html?id=pages-work-map-v2--active-work&viewMode=story", process.env.TARGET_URL).href);

  const filter = page.getByRole("button", { name: /^Filter/ });
  const actions = page.getByRole("button", { name: "Actions", exact: true });
  const reset = page.getByRole("button", { name: "Reset view", exact: true });
  await filter.click();
  for (const [field, choice] of [
    ["Work type", "Projects"],
    ["Goal status", "Pending"],
    ["Project status", "On track"],
  ]) {
    await page
      .getByRole("group", { name: field, exact: true })
      .getByRole("menuitemcheckbox", { name: choice, exact: true })
      .click();
  }
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Filter.*4/ }).waitFor();

  for (const width of [320, 393, 428]) {
    await page.setViewportSize({ width, height: 800 });
    const [toggle, filters, more, resetBox] = await Promise.all([
      page.getByRole("button", { name: "Table", exact: true }).boundingBox(),
      filter.boundingBox(),
      actions.boundingBox(),
      reset.boundingBox(),
    ]);
    assert.ok(toggle && filters && more && resetBox);
    const center = toggle.y + toggle.height / 2;
    assert.ok([filters, more].every((box) => box.y <= center && center <= box.y + box.height));
    assert.ok(more.x + more.width <= width);
    assert.ok(resetBox.y >= more.y + more.height);
    assert.ok(Math.abs(resetBox.x + resetBox.width - (more.x + more.width)) < 1);
  }

  await reset.click();
  await page.getByRole("button", { name: /Filter.*1/ }).waitFor();
  await reset.waitFor({ state: "detached" });
  await actions.click();
  await page.getByRole("menuitemcheckbox", { name: "Show KPIs" }).waitFor();
  assert.equal(await page.getByRole("group", { name: "Columns" }).count(), 0);
  await page.locator('[data-test-id="work-map-organize"]').click();
  await page.locator('[data-test-id="cancel-organize"]').waitFor();
});

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
