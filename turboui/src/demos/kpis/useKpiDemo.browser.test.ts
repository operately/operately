import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

// Exercise the real story adapter so route and slide-in lifecycles cannot discard demo state.
test("KPI demos keep edits and comments across navigation and reset on reload", async () => {
  page.setDefaultTimeout(10_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "pages-spacekpispage--default");
  url.searchParams.set("viewMode", "story");
  await page.goto(url.href);
  const byId = (id: string) => page.locator(`[data-test-id="${id}"]`);
  await byId("kpi-row-kpi-mrr").click();
  const name = byId("kpi-name");
  const originalName = await name.innerText();
  await name.click();
  await byId("kpi-name-input").fill("Demo revenue");
  await byId("kpi-name-input").press("Enter");
  await page.waitForFunction(
    () => document.querySelector<HTMLElement>('[data-test-id="kpi-name"]')?.innerText === "Demo revenue",
  );

  await byId("project-unsubscribe-button").click();
  await byId("project-subscribe-button").waitFor();
  const commentsToggle = page.locator('[data-test-id^="entry-comments-toggle-"]').first();
  const toggleId = await commentsToggle.getAttribute("data-test-id");
  assert.ok(toggleId);
  await commentsToggle.click();
  await byId("add-comment").click();
  await byId("new-comment-form").locator('[contenteditable="true"]').fill("A note that survives navigation.");
  await byId("post-comment").click();
  const commentText = page.getByText("A note that survives navigation.", { exact: true });
  await commentText.waitFor();
  await byId("slide-in-close-button").click();
  await byId("entry-comments-slide-in").waitFor({ state: "detached" });
  await byId(toggleId).click();
  await commentText.waitFor();
  await byId("slide-in-close-button").click();
  await byId("entry-comments-slide-in").waitFor({ state: "detached" });

  await byId("kpis-breadcrumb").click();
  await byId("kpi-row-kpi-nps").click();
  await byId("project-unsubscribe-button").waitFor();
  await byId("kpis-breadcrumb").click();
  await byId("kpi-row-kpi-mrr").click();
  assert.equal(await name.innerText(), "Demo revenue");
  await byId("project-subscribe-button").waitFor();
  await byId(toggleId).click();
  await commentText.waitFor();

  await page.reload();
  await byId("kpi-row-kpi-mrr").click();
  assert.equal(await name.innerText(), originalName);
  await byId("project-unsubscribe-button").waitFor();
  await byId(toggleId).click();
  await byId("add-comment").waitFor();
  assert.equal(await commentText.count(), 0);
}, 30_000);

test("failed KPI comment mutations retain content and show feedback", async () => {
  page.setDefaultTimeout(10_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(error.message);
  page.on("pageerror", onError);
  try {
    const url = new URL("iframe.html", process.env.TARGET_URL);
    url.searchParams.set("id", "pages-spacekpispage--mutation-errors");
    await page.goto(url.href);
    const byId = (id: string) => page.locator(`[data-test-id="${id}"]`);
    await byId("kpi-row-kpi-mrr").click();
    await page.locator('[data-test-id^="entry-comments-toggle-"]').first().click();
    const existingComment = byId("comment-comment-mrr-note");
    await existingComment.locator('[data-test-id="comment-options"]').click();
    await byId("delete-comment").click();
    await page.getByText("Comment not deleted", { exact: true }).waitFor();
    assert.equal(await existingComment.count(), 1);

    await byId("add-comment").click();
    const editor = byId("new-comment-form").locator('[contenteditable="true"]');
    await editor.fill("Keep this draft after failure.");
    await byId("post-comment").click();
    await page.getByText("Comment not posted", { exact: true }).waitFor();
    assert.equal(await editor.innerText(), "Keep this draft after failure.");
    assert.equal(await byId("post-comment").isEnabled(), true);
    assert.equal(await page.locator('[data-test-id^="comment-comment-"]').count(), 1);
    assert.deepEqual(errors, []);
  } finally {
    page.off("pageerror", onError);
  }
}, 30_000);
