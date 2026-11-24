import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

it("keeps all resource choices reachable on a short screen and clears editor accessibility on Escape", async () => {
  await page.setViewportSize({ width: 640, height: 360 });
  await page.goto(
    "http://127.0.0.1:6006/iframe.html?id=components-richeditor--resource-references-long-list&viewMode=story",
  );
  const editor = page.locator('[contenteditable="true"]').first();
  await editor.fill("#work");
  const list = page.getByRole("listbox");
  await list.waitFor();
  assert.equal(await list.getByRole("option").count(), 15);
  assert.ok(await list.evaluate((element) => element.scrollHeight > element.clientHeight));
  for (let index = 0; index < 14; index++) await editor.press("ArrowDown");
  const selected = list.getByRole("option", { selected: true });
  assert.equal(await selected.getAttribute("data-test-id"), "mention-resource-task-task-14");
  assert.equal(await editor.getAttribute("aria-activedescendant"), await selected.getAttribute("id"));
  assert.equal(await editor.getAttribute("aria-controls"), await list.getAttribute("id"));
  const listBounds = await list.boundingBox();
  const selectedBounds = await selected.boundingBox();
  assert.ok(listBounds && selectedBounds);
  assert.ok(listBounds.y >= 0 && listBounds.y + listBounds.height <= 361);
  assert.ok(
    selectedBounds.y >= listBounds.y && selectedBounds.y + selectedBounds.height <= listBounds.y + listBounds.height,
  );
  await editor.press("Escape");
  await list.waitFor({ state: "detached" });
  assert.equal(await editor.getAttribute("aria-controls"), null);
  assert.equal(await editor.getAttribute("aria-activedescendant"), null);
});
