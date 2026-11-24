import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

describe("Rich editor toolbar in a browser", () => {
  beforeAll(async () => {
    // Check-in stories restore local drafts; keep each navigation independent.
    await page.addInitScript(() => window.localStorage.clear());
  });

  test.each([
    ["374px check-in", "pages-projectcheckinformpage--first-check-in", 374],
    ["constrained compact editor", "components-richeditor--compact-headings", 1280],
  ])("keeps all primary controls and overflow actions usable in the %s", async (_name, story, width) => {
    await openEditorStory(story, width);
    const toolbar = page.locator('[data-test-id="rich-editor-toolbar"]');
    const primary = page.locator('[data-test-id="rich-editor-primary-controls"]');
    const overflow = page.locator('[data-test-id="rich-editor-overflow"]');
    const editor = page.locator('[contenteditable="true"]');

    if (width === 1280) {
      // Constrain the existing compact story while keeping the desktop breakpoint.
      await toolbar.locator("..").evaluate((element) => (element.style.width = "280px"));
    }
    await toolbar.scrollIntoViewIfNeeded();
    assert.equal(await primary.locator("button").count(), 4, "Keeps basic formatting and attachment upload visible");
    assert.equal(
      await primary.evaluate((element) => element.scrollWidth <= element.clientWidth),
      true,
      "Primary controls must have no horizontal scroll range",
    );
    await assertToolbarFits(toolbar, editor);
    const primaryBounds = await primary.boundingBox();
    assert.ok(primaryBounds);
    await assertControlsFit(primary.locator("button"), primaryBounds);
    assert.equal(await controlRowCount(toolbar.locator("button")), 1, "Toolbar stays on one row");

    await editor.fill("Mobile check-in");
    await editor.press("ControlOrMeta+a");
    await toolbar.locator('[data-test-id="toolbar-button-bold"]').click();
    assert.equal(await editor.locator("strong").textContent(), "Mobile check-in");

    await overflow.click();
    const popup = page.getByRole("dialog");
    await popup.waitFor();
    assert.equal(await popup.locator("button").count(), 16, "All overflow actions and Markdown help remain available");
    assert.equal(await popup.getByRole("button", { name: "Insert diagram", exact: true }).count(), 1);
    const popupBounds = await popup.boundingBox();
    assert.ok(popupBounds);
    await assertControlsFit(popup.locator("button"), popupBounds);
    await popup.getByRole("button", { name: "Heading 2", exact: true }).click();
    await editor.locator("h2").filter({ hasText: "Mobile check-in" }).waitFor();
    await editor.click();
    await editor.press("ControlOrMeta+a");
    await popup.waitFor({ state: "hidden" });
    await overflow.click();
    await popup.locator('[data-test-id="toolbar-button-highlight"]').click();
    await page.locator('[data-test-id="textYellow"]').click();
    await editor.locator('mark[data-highlight="textYellow"]').filter({ hasText: "Mobile check-in" }).waitFor();
    await editor.click();
    await popup.waitFor({ state: "hidden" });
    await overflow.click();
    await popup.locator('[data-test-id="toolbar-button-task-list"]').click();
    await editor.locator('[data-type="taskList"]').waitFor();
  });

  test("keeps the desktop controls on one row with formatting and table insertion available", async () => {
    await openEditorStory("pages-projectcheckinformpage--first-check-in", 1280);
    const toolbar = page.locator('[data-test-id="rich-editor-toolbar"]');
    const editor = page.locator('[contenteditable="true"]');
    assert.equal(await page.locator('[data-test-id="rich-editor-overflow"]').count(), 0);
    await toolbar.scrollIntoViewIfNeeded();
    await assertToolbarFits(toolbar, editor);
    assert.equal(await controlRowCount(toolbar.locator("button")), 1);
    await editor.fill("Desktop check-in");
    await editor.press("ControlOrMeta+a");
    await toolbar.locator('[data-test-id="toolbar-button-bold"]').click();
    assert.equal(await editor.locator("strong").textContent(), "Desktop check-in");
    await toolbar.locator('[data-test-id="toolbar-button-table"]').click();
    await editor.locator("table").waitFor();
  });

  test("switches toolbar modes when the editor container changes width without losing content", async () => {
    await openEditorStory("components-richeditor--default", 1280);
    const toolbar = page.locator('[data-test-id="rich-editor-toolbar"]');
    const container = toolbar.locator("..");
    const editor = page.locator('[contenteditable="true"]');
    const overflow = page.locator('[data-test-id="rich-editor-overflow"]');

    await container.evaluate((element) => (element.style.width = "566px"));
    await overflow.waitFor();
    await assertToolbarFits(toolbar, editor);

    await editor.fill("Narrow editor draft");
    await container.evaluate((element) => (element.style.width = "800px"));
    await overflow.waitFor({ state: "hidden" });
    await assertToolbarFits(toolbar, editor);
    assert.equal(await editor.textContent(), "Narrow editor draft");

    await container.evaluate((element) => (element.style.width = "566px"));
    await overflow.waitFor();
    await assertToolbarFits(toolbar, editor);
    await editor.press("ControlOrMeta+a");
    await overflow.click();
    await page.getByRole("dialog").getByRole("button", { name: "Heading 2", exact: true }).click();
    await editor.locator("h2").filter({ hasText: "Narrow editor draft" }).waitFor();
  });

  test.each([
    [768, 1024],
    [900, 1200],
    [1373, 1053],
  ])("keeps task notes within the slide-in sidebar at %s × %s", async (width, height) => {
    await openStory("pages-taskpage--template-task", width, height);
    const slideIn = page.locator('[data-test-id="task-slide-in"]');
    await slideIn.locator('[data-test-id="task-notes-empty"]').getByRole("button").click();
    const toolbar = slideIn.locator('[data-test-id="rich-editor-toolbar"]');
    const editor = slideIn.locator('[contenteditable="true"]');
    await slideIn.locator('[data-test-id="rich-editor-overflow"]').waitFor();
    await assertToolbarFits(toolbar, editor);

    const toolbarBounds = await toolbar.boundingBox();
    const sidebarBounds = await slideIn.locator('[data-test-id="task-sidebar"]').boundingBox();
    assert.ok(toolbarBounds && sidebarBounds);
    assert.ok(toolbarBounds.x + toolbarBounds.width <= sidebarBounds.x, "Notes must not overlap sidebar controls");
    await editor.fill("Task notes draft");
    assert.equal(await editor.textContent(), "Task notes draft");
  });
});

async function openStory(story: string, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", story);
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);
}

async function openEditorStory(story: string, width: number) {
  await openStory(story, width);
  await page.locator('[contenteditable="true"]').waitFor();
}

async function assertToolbarFits(toolbar: Locator, editor: Locator) {
  const bounds = await toolbar.boundingBox();
  const container = await toolbar.locator("..").boundingBox();
  const body = await editor.boundingBox();
  assert.ok(bounds && container && body);
  assert.ok(bounds.x >= container.x && bounds.x + bounds.width <= container.x + container.width);
  assert.ok(bounds.y + bounds.height <= body.y, "Toolbar must not overlap the editor body");
  await assertControlsFit(toolbar.locator("button"), bounds);
}

async function controlRowCount(controls: Locator) {
  return controls.evaluateAll(
    (buttons) =>
      new Set(
        buttons.map((button) => {
          const bounds = button.getBoundingClientRect();
          return Math.round(bounds.top + bounds.height / 2);
        }),
      ).size,
  );
}

async function assertControlsFit(
  controls: Locator,
  container: { x: number; y: number; width: number; height: number },
) {
  const rectangles = await controls.evaluateAll((buttons) =>
    buttons.map((button) => {
      const { x, y, width, height } = button.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
  for (const [index, bounds] of rectangles.entries()) {
    assert.ok(bounds.width > 0 && bounds.height > 0, `Control ${index} is visible`);
    assert.ok(bounds.x >= container.x && bounds.x + bounds.width <= container.x + container.width + 1);
    assert.ok(bounds.y >= container.y && bounds.y + bounds.height <= container.y + container.height + 1);
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= (page.viewportSize()?.width ?? 0));
    for (const other of rectangles.slice(index + 1)) {
      const overlapWidth = Math.min(bounds.x + bounds.width, other.x + other.width) - Math.max(bounds.x, other.x);
      const overlapHeight = Math.min(bounds.y + bounds.height, other.y + other.height) - Math.max(bounds.y, other.y);
      assert.ok(overlapWidth <= 0 || overlapHeight <= 0, "Controls must not overlap");
    }
  }
}
