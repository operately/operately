import assert from "node:assert/strict";
import type { Page } from "playwright";
import { waitForPageReady } from "@storybook/test-runner";

declare const page: Page;

beforeEach(() => {
  page.setDefaultTimeout(5000);
});

async function visit(story = "review", thread?: string) {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", `pages-documentpage-inlinecomments--${story}`);
  url.searchParams.set("viewMode", "story");
  if (thread) url.searchParams.set("inlineThread", thread);
  await page.goto(url.href);
  await page.locator('[data-test-id="document-page"]').waitFor();
  await page.locator("body.light").waitFor();
  await waitForPageReady(page);
}

async function waitForMobileDialog() {
  const dialog = page.locator('[data-test-id="inline-comments-mobile"]');
  // Focus does not wait for actionability; let the slide-in finish opening first.
  await dialog.locator('[data-test-id="slide-in-close-button"]').click({ trial: true });
  return dialog;
}

async function selectPassage() {
  await page
    .locator('.ProseMirror[contenteditable="false"]')
    .first()
    .evaluate((editor) => {
      const paragraph = editor.querySelector("p");
      if (!paragraph) throw new Error("Missing passage");
      const text = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT).nextNode();
      if (!text) throw new Error("Missing text");
      editor.focus();
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 6);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  await page.locator('[data-test-id="inline-add-selection"]').click();
}

test.each([1440, 390])("header comments button opens all threads at %s px", async (width) => {
  await page.setViewportSize({ width, height: 1000 });
  await visit();
  const toggle = page.locator('[data-test-id="inline-comments-toggle"]');
  const menu = page.locator('[data-test-id="options-button"]');
  const toggleBox = await toggle.boundingBox();
  const menuBox = await menu.boundingBox();
  assert.ok(toggleBox && menuBox && toggleBox.x + toggleBox.width <= menuBox.x);
  if (width >= 1024) {
    const editBox = await page.locator('[data-test-id="edit-document-link"]').boundingBox();
    assert.ok(editBox && editBox.x + editBox.width <= toggleBox.x);
  }
  assert.equal(await page.locator('[data-test-id="inline-thread-resolved"]').count(), 0);
  await toggle.click();
  const dialog = await waitForMobileDialog();
  assert.equal(await dialog.locator("[data-resolved]").count(), 4);
  assert.equal(await dialog.locator('div[data-test-id^="comment-"][id]').count(), 4);
  assert.equal(await dialog.locator('[data-test-id="inline-unattached"]').count(), 1);
  const resolvedGroup = dialog.locator('[data-test-id="inline-comments-resolved"]');
  await resolvedGroup.locator('[data-test-id="inline-thread-resolved"]').waitFor();
  const resolved = dialog.locator('[data-test-id="inline-thread-resolved"]');
  assert.equal(await resolved.locator('[data-test-id="add-comment"], [contenteditable="true"]').count(), 0);
  await resolved.hover();
  await resolved.locator('[data-test-id="inline-resolve-resolved"]').click();
  await dialog.locator('[data-test-id="inline-thread-resolved"][data-resolved="false"]').waitFor();
  await resolved.locator('[data-test-id="add-comment"]').waitFor();
  assert.equal(await resolvedGroup.count(), 0);
  await dialog.locator('[data-test-id="slide-in-close-button"]').focus();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert.equal(await toggle.evaluate((element) => element === document.activeElement), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
});

test("all-comments panel supports empty documents and read-only viewers", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("empty");
  await page.locator('[data-test-id="inline-comments-toggle"]').click();
  const dialog = await waitForMobileDialog();
  await dialog.locator('[data-test-id="inline-comments-empty"]').waitFor();
  await visit("read-only");
  await page.locator('[data-test-id="inline-comments-toggle"]').click();
  await waitForMobileDialog();
  assert.equal(await dialog.locator("[data-resolved]").count(), 4);
  assert.equal(
    await dialog
      .locator('[contenteditable="true"], [data-test-id^="inline-resolve-"], [data-test-id="add-comment"]')
      .count(),
    0,
  );
});

test("select, post, reply, resolve, and reopen using the actual editor", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit();
  await selectPassage();
  const composer = page.locator('[data-test-id="inline-new-thread"]');
  await composer.locator('[contenteditable="true"]').fill("Please confirm the owner.");
  await composer.locator('[data-test-id="post-comment"]').click();
  const thread = page.locator('[data-test-id="inline-thread-new-1"]');
  await thread.waitFor();
  await thread.locator('[data-test-id="add-comment"]').waitFor();
  assert.equal(await thread.locator('[contenteditable="true"]').count(), 0);
  await thread.locator('[data-test-id="add-comment"]').click();
  await thread.locator('[contenteditable="true"]').fill("I will own this.");
  await thread.locator('[data-test-id="post-comment"]').click();
  await thread.locator('div[data-test-id^="comment-"][id]').nth(1).waitFor();
  await thread.locator('[data-test-id="add-comment"]').waitFor();
  assert.equal(await thread.locator('[contenteditable="true"]').count(), 0);
  assert.equal(await thread.locator('[data-test-id="inline-resolve-new-1"]').count(), 1);
  assert.equal(
    await thread.locator('div[data-test-id^="comment-"][id] [data-test-id="inline-resolve-new-1"]').count(),
    0,
  );
  await thread.hover();
  await thread.locator('[data-test-id="inline-resolve-new-1"]').click();
  await page.locator('[data-test-id="inline-thread-new-1"][data-resolved="true"]').waitFor();
  await thread.hover();
  await thread.locator('[data-test-id="inline-resolve-new-1"]').click();
  await page.locator('[data-test-id="inline-thread-new-1"][data-resolved="false"]').waitFor();
  assert.ok(page.url().includes("inlineThread=new-1"));
});

test("opens resolved thread links directly", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("review", "resolved");
  await page.locator('[data-test-id="inline-resolve-resolved"]').waitFor();
  assert.equal((await page.locator('[data-inline-thread="resolved"]').count()) > 0, true);
});

test("outside clicks collapse a thread only after its reply input is closed", async () => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit();
  const card = page.locator('[data-test-id="inline-thread-checklist"]');
  const preview = card.locator('[data-test-id="inline-select-checklist"]');
  const editor = card.locator('[contenteditable="true"]');
  const outside = page.locator('[data-test-id="document-page"]');
  await preview.click();
  await editor.fill("Keep this reply open.");
  await outside.click({ position: { x: 20, y: 20 } });
  assert.equal(await editor.textContent(), "Keep this reply open.");
  assert.equal(await preview.count(), 0);

  await card.getByRole("button", { name: "Cancel", exact: true }).click();
  await editor.waitFor({ state: "detached" });
  await card.locator("blockquote").click();
  assert.equal(await preview.count(), 0);
  await outside.click({ position: { x: 20, y: 20 } });
  assert.equal(await preview.count(), 1);
  assert.equal(new URL(page.url()).searchParams.has("inlineThread"), false);

  await preview.click();
  await editor.waitFor();
});

test("mobile panel preserves the draft on close and contains keyboard focus", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("mobile");
  await selectPassage();
  const dialog = await waitForMobileDialog();
  const editor = dialog.locator('[data-test-id="inline-new-thread"] [contenteditable="true"]');
  await editor.fill("Keep my mobile draft.");
  await dialog.locator('[data-test-id="slide-in-close-button"]').focus();
  await page.keyboard.press("Shift+Tab");
  assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true);
  await dialog.locator('[data-test-id="slide-in-close-button"]').click();
  await dialog.waitFor({ state: "detached" });
  await page.locator('[data-inline-thread="checklist"]').first().click();
  await editor.waitFor();
  assert.equal(await editor.textContent(), "Keep my mobile draft.");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
});

test("mobile thread links open the panel and Escape restores focus", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("mobile", "checklist");
  const dialog = await waitForMobileDialog();
  await dialog.locator('[data-test-id="inline-resolve-checklist"]').waitFor();
  await dialog.locator('[data-test-id="slide-in-close-button"]').focus();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  assert.equal(
    await page
      .locator('[data-test-id="document-page"]')
      .evaluate((documentPage) => documentPage.contains(document.activeElement)),
    true,
  );
});

test("cards float beside their passages, activate on click, and remain read-only for viewers", async () => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit();
  const card = page.locator('[data-test-id="inline-thread-checklist"]');
  await card.waitFor();
  assert.equal(await page.locator('[data-test-id="inline-comments-toolbar"]').count(), 0);
  assert.equal(await page.locator('[data-test-id="inline-add-toolbar"]').count(), 0);
  const paper = await page.locator('[data-test-id="document-page"]').boundingBox();
  const passage = await page.locator('[data-inline-thread="checklist"]').first().boundingBox();
  const preview = await card.boundingBox();
  assert.ok(paper && passage && preview);
  assert.ok(preview.x >= paper.x + paper.width);
  assert.ok(Math.abs(preview.y - passage.y) < 5);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/inline-floating-preview.png` });
  await page.locator('[data-test-id="inline-select-checklist"]').click();
  await card.locator('[contenteditable="true"]').waitFor();
  const expanded = await card.boundingBox();
  const following = await page.locator('[data-test-id="inline-thread-deadline"]').boundingBox();
  assert.ok(expanded && following && following.y >= expanded.y + expanded.height);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/inline-floating-active.png` });
  await visit("read-only");
  await page.locator('[data-test-id="inline-select-checklist"]').click();
  await card.locator('div[data-test-id^="comment-"][id]').waitFor();
  assert.equal(await card.locator('[contenteditable="true"]').count(), 0);
  assert.equal(await card.locator('[data-test-id="inline-resolve-checklist"]').count(), 0);
  await page.locator('[data-test-id="document-page"]').click({ position: { x: 20, y: 20 } });
  await card.locator('[data-test-id="inline-select-checklist"]').waitFor();
});

test("hover and keyboard focus reveal only resolve, edit, and delete actions", async () => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit("own-comment");
  await page.mouse.move(0, 0);
  const card = page.locator('[data-test-id="inline-thread-checklist"]');
  const actions = card.locator('[data-test-id="inline-resolve-checklist"]').locator("..");
  assert.equal(await actions.evaluate((element) => getComputedStyle(element).opacity), "0");
  await card.locator('[data-test-id="inline-select-checklist"]').focus();
  assert.equal(await actions.evaluate((element) => getComputedStyle(element).opacity), "1");
  await page.locator('[data-test-id="document-page"]').click({ position: { x: 20, y: 20 } });
  await card.hover();
  assert.equal(await actions.evaluate((element) => getComputedStyle(element).opacity), "1");
  await card.locator('[data-test-id="comment-options"]').click();
  assert.equal(await page.getByRole("menuitem").count(), 2);
  assert.equal(await page.locator('[data-test-id="copy-comment-link"]').count(), 0);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/inline-hover-menu.png` });
  await page.locator('[data-test-id="edit-comment"]').click();
  const edit = card.locator('[data-test-id="edit-comment-form"]');
  await edit.locator('[contenteditable="true"]').fill("Updated from the card menu.");
  await page.locator('[data-test-id="document-page"]').click({ position: { x: 20, y: 20 } });
  assert.equal(await edit.locator('[contenteditable="true"]').textContent(), "Updated from the card menu.");
  await edit.locator('[data-test-id="post-comment"]').click();
  await edit.waitFor({ state: "detached" });
  await card.locator('div[data-test-id^="comment-"][id]').first().hover();
  await card.locator('[data-test-id="comment-options"]').click();
  assert.equal(await page.getByRole("menuitem").count(), 2);
  await page.locator('[data-test-id="delete-comment"]').click();
  await card.waitFor({ state: "detached" });
});

test("empty documents keep their original layout and lend side padding to a new comment", async () => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  async function geometry() {
    const paper = await page.locator('[data-test-id="document-page"]').boundingBox();
    const body = await page.locator('[data-test-id="document-page"] .ProseMirror').first().boundingBox();
    assert.ok(paper && body);
    return { x: paper.x, width: paper.width, padding: body.x - paper.x, textWidth: body.width };
  }
  await visit("feature-disabled");
  const original = await geometry();
  await visit("empty");
  assert.deepEqual(await geometry(), original);
  await selectPassage();
  const composer = page.locator('[data-test-id="inline-new-thread"]');
  await composer.locator('[contenteditable="true"]').waitFor();
  const composing = await geometry();
  assert.ok(composing.padding < original.padding);
  assert.equal(composing.textWidth, original.textWidth);
  const card = await composer.boundingBox();
  assert.ok(card);
  assert.equal(card.width, 352);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert.ok(Math.abs(composing.x - (viewportWidth - card.x - card.width)) < 2);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/inline-wider-composer.png` });
  await composer.getByRole("button", { name: "Cancel", exact: true }).click();
  await composer.waitFor({ state: "detached" });
  assert.deepEqual(await geometry(), original);

  await visit("review");
  const paper = await geometry();
  const comments = await page.locator('[data-test-id="inline-comments-floating"]').boundingBox();
  assert.ok(comments);
  assert.ok(Math.abs(paper.x - (viewportWidth - comments.x - comments.width)) < 2);
});

test("mobile readers can open and revisit an unattached thread without highlights", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("unattached-read-only");
  assert.equal(await page.locator("[data-inline-thread]").count(), 0);
  const preview = page.locator('[data-test-id="inline-comments-previews"]');
  await preview.locator('[data-test-id="inline-select-removed"]').click();
  const dialog = await waitForMobileDialog();
  const panel = dialog.locator('[data-test-id="inline-comments-panel"]');
  await panel.locator('[data-test-id="inline-unattached"]').waitFor();
  assert.equal(await panel.locator('[contenteditable="true"]').count(), 0);
  await dialog.locator('[data-test-id="slide-in-close-button"]').click();
  await dialog.waitFor({ state: "detached" });
  await preview.locator('[data-test-id="inline-select-removed"]').click();
  await panel.locator('[data-test-id="inline-unattached"]').waitFor();
});

test("the composer cannot be edited while its submitted text is being saved", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("slow-posting");
  await selectPassage();
  const composer = page.locator('[data-test-id="inline-new-thread"]');
  const editor = composer.locator(".ProseMirror[contenteditable]");
  await editor.fill("Submitted text");
  await composer.locator('[data-test-id="post-comment"]').click();
  assert.equal(await editor.getAttribute("contenteditable"), "false");
  await editor.pressSequentially("Must not be lost");
  assert.equal(await editor.innerText(), "Submitted text");
  await page.locator('[data-test-id="inline-thread-new-1"]').waitFor();
});
