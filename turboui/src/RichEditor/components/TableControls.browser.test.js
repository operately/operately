const assert = require("node:assert/strict");

// The Storybook runner provides Jest and a real Playwright page. jsdom cannot
// reproduce focus transitions across shadow boundaries.
describe("Table controls in a browser", () => {
  test.each([
    ["Shadow DOM", "table-menus"],
    ["scaled Shadow DOM", "scaled-table-menus"],
    ["normal document", "document-table-menus"],
    ["dialog in Shadow DOM", "dialog-table-menus"],
  ])("keeps menus stable and restores focus in %s", async (_environment, story) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", `utilities-embedding--${story}`);
    url.searchParams.set("viewMode", "story");
    await page.goto(url.href);
    await checkTableMenus(page);
  });
});

async function checkTableMenus(page) {
  await page.locator('[data-test-id="open-table-dialog"], [contenteditable="true"]').first().waitFor();
  const openDialog = page.locator('[data-test-id="open-table-dialog"]');
  const inDialog = (await openDialog.count()) > 0;
  if (inDialog) await openDialog.click();
  const editor = page.locator('[contenteditable="true"]');
  const action = (name) => page.locator(`[data-test-id="table-${name}"]`);
  const toolbar = (name) => page.locator(`[data-test-id="table-toolbar-${name}"]`);
  const settings = page.locator('[data-test-id="toolbar-button-table-settings"]');
  const menu = page.locator('[role="menu"][data-table-controls]');
  const preview = page.locator('[data-test-id="table-action-preview"]');
  const outside = page.locator('[data-test-id="outside-editor"]');

  await editor.click();
  await page.getByRole("button", { name: "Table", exact: true }).click();
  const cell = editor.locator("td, th").first();
  await cell.click();
  await page.keyboard.type("Keep this cell");
  await cell.click({ button: "right" });
  await menu.waitFor();
  await assertStableMenu(menu);
  // The menu can appear beneath the stationary pointer; enter the action from outside it.
  await page.mouse.move(0, 0);
  await action("addRowAfter").hover();
  await preview.waitFor();
  assert.equal(await preview.getAttribute("data-action"), "addRowAfter");
  const highlight = await preview.boundingBox();
  const tableBounds = await editor.locator("table").boundingBox();
  assert.ok(highlight && tableBounds && Math.abs(highlight.width - tableBounds.width) < 3);
  await action("addRowAfter").click();
  assert.equal(await editor.locator("tr").count(), 4);
  await assertFocused(editor);
  assert.equal(await cell.textContent(), "Keep this cell");

  // Keyboard opening, action activation, Escape, and focus restoration.
  await page.keyboard.press("Shift+F10");
  await menu.waitFor();
  await assertStableMenu(menu);
  await action("addColumnAfter").focus();
  await page.keyboard.press("Enter");
  assert.equal(await editor.locator("tr").first().locator("td, th").count(), 4);
  await assertFocused(editor);
  await page.keyboard.press("Alt+F10");
  await assertFocused(toolbar("deleteRow"));
  await page.keyboard.press("Escape");
  await assertFocused(editor);
  await page.keyboard.press("Shift+F10");
  await menu.waitFor();
  await page.keyboard.press("Escape");
  await menu.waitFor({ state: "detached" });
  await assertFocused(editor);
  await preview.waitFor({ state: "detached" });
  if (inDialog) assert.equal(await page.locator('[data-test-id="table-dialog"]').count(), 1);

  // Settings menus use the same focus lifecycle as context menus.
  await settings.click();
  await menu.waitFor();
  await assertStableMenu(menu);
  await action("toggleHeaderRow").click();
  assert.equal(await editor.locator("th").count(), 0);
  await assertFocused(editor);
  const beforeDeletion = await tableContents(editor);
  await toolbar("deleteRow").click();
  assert.equal(await editor.locator("tr").count(), 3);
  await assertFocused(editor);
  const undoKey = await page.evaluate(() => (/Mac/.test(navigator.platform) ? "Meta+z" : "Control+z"));
  await page.keyboard.press(undoKey);
  assert.deepEqual(await tableContents(editor), beforeDeletion);

  // Focusing another control inside the same root must dismiss without reopening on return.
  await cell.click({ button: "right" });
  await menu.waitFor();
  await outside.focus();
  await menu.waitFor({ state: "detached" });
  await assertFocused(outside);
  await cell.click();
  assert.equal(await menu.count(), 0);
  await cell.click({ button: "right" });
  await menu.waitFor();
  await outside.click();
  await menu.waitFor({ state: "detached" });
  assert.equal(await settings.count(), 0);

  // The editor's link form can take focus without leaving a stale table menu behind.
  await cell.click();
  await page.locator('[data-test-id="toolbar-button-add-edit-links"]').click();
  const linkInput = page.locator("[data-link-edit-form] input");
  await assertFocused(linkInput);
  assert.equal(await menu.count(), 0);
  await page.locator("[data-link-edit-form]").getByRole("button", { name: "Cancel" }).click();
  await assertFocused(editor);
  await cell.click({ button: "right" });
  await menu.waitFor();
  await assertStableMenu(menu);
  await page.keyboard.press("Escape");
  await assertFocused(editor);

  if (inDialog) {
    await outside.focus();
    await page.keyboard.press("Escape");
    await page.locator('[data-test-id="table-dialog"]').waitFor({ state: "detached" });
    await assertFocused(openDialog);
  }
}

async function tableContents(editor) {
  return editor
    .locator("tr")
    .evaluateAll((rows) =>
      rows.map((row) => Array.from(row.cells, (cell) => ({ type: cell.tagName, text: cell.textContent }))),
    );
}

async function assertFocused(locator) {
  await locator.waitFor();
  const element = await locator.elementHandle();
  try {
    await locator.page().waitForFunction((element) => element.getRootNode().activeElement === element, element);
    await locator.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
    assert.equal(await locator.evaluate((element) => element.getRootNode().activeElement === element), true);
  } finally {
    await element.dispose();
  }
}

async function assertStableMenu(menu) {
  const stable = await menu.evaluate(async (element) => {
    const root = element.getRootNode();
    // Storybook pauses document animations, but animations inside a shadow root still run.
    await Promise.all(
      element
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .map((animation) => animation.finished),
    );
    // Observe several rendering frames: visibility alone can pass between repeated menu mounts.
    for (let frame = 0; frame < 12; frame++) {
      await new Promise(requestAnimationFrame);
      if (!element.isConnected || !element.contains(root.activeElement)) return false;
    }
    return true;
  });
  assert.equal(stable, true, "The table menu must stay mounted and retain focus");
}
