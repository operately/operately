import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

const mobileViewport = { width: 374, height: 812 };
const desktopViewport = { width: 1280, height: 720 };

function storyUrl(story: string) {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", `pages-goalpage--${story}`);
  url.searchParams.set("viewMode", "story");
  return url.href;
}

async function boundsOf(action: Locator) {
  const bounds = await action.boundingBox();
  assert.ok(bounds, "action must be visible");
  return bounds;
}

async function assertTouchSize(action: Locator) {
  const bounds = await boundsOf(action);
  assert.ok(bounds.width >= 44, `action width is ${bounds.width}px`);
  assert.ok(bounds.height >= 44, `action height is ${bounds.height}px`);
  return bounds;
}

async function assertNoHorizontalOverflow() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
}

async function assertSeparateActions(first: Locator, second: Locator) {
  const left = await boundsOf(first);
  const right = await boundsOf(second);
  const overlapWidth = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const overlapHeight = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
  assert.ok(overlapWidth <= 0 || overlapHeight <= 0, "clickable areas must not overlap");
}

describe("goal actions in a browser", () => {
  test("empty mobile goal actions fit, open forms, and preserve related-work destinations", async () => {
    await page.setViewportSize(mobileViewport);
    await page.goto(storyUrl("mobile-empty"));

    const addGoal = page.locator('[data-test-id="add-subgoal"]');
    const addProject = page.locator('a[href="/projects/new?goalId=goal-1&spaceId=space-1"]');
    const goalBounds = await assertTouchSize(addGoal);
    const projectBounds = await assertTouchSize(addProject);
    const heading = await boundsOf(page.locator('[data-test-id="related-work-section"] h2'));
    assert.equal(await addGoal.getAttribute("href"), "/goals/new?parentGoalId=goal-1&spaceId=space-1");
    assert.ok(projectBounds.x - (goalBounds.x + goalBounds.width) >= 8);
    assert.ok(mobileViewport.width - (projectBounds.x + projectBounds.width) >= 16);
    assert.ok(projectBounds.y >= goalBounds.y);
    assert.ok(goalBounds.y >= heading.y + heading.height + 8);
    await assertSeparateActions(addGoal, addProject);
    await assertNoHorizontalOverflow();

    const addTarget = page.locator('[data-test-id="add-target"]');
    await assertTouchSize(addTarget);
    await addTarget.click();
    await page.locator('[data-test-id="target-name"]').waitFor();
    await assertTouchSize(page.locator('[data-test-id="cancel"]'));
    await assertTouchSize(page.locator('[data-test-id="save"]'));
    await assertSeparateActions(page.locator('[data-test-id="cancel"]'), page.locator('[data-test-id="save"]'));
    await page.locator('[data-test-id="cancel"]').click();

    const addChecklist = page.locator('[data-test-id="add-checklist-item"]');
    await assertTouchSize(addChecklist);
    await addChecklist.click();
    await page.locator('[data-test-id="checklist-item-name"]').waitFor();
    await assertTouchSize(page.locator('[data-test-id="cancel"]'));
    await assertTouchSize(page.locator('[data-test-id="save"]'));
    await assertSeparateActions(page.locator('[data-test-id="cancel"]'), page.locator('[data-test-id="save"]'));
  });

  test("populated mobile goal has touch-sized edit and target actions", async () => {
    await page.setViewportSize(mobileViewport);
    await page.goto(storyUrl("mobile-populated"));

    const editDescription = page.locator('[data-test-id="edit-description"]');
    const bounds = await assertTouchSize(editDescription);
    const browser = page.context().browser();
    assert.ok(browser);
    const context = await browser.newContext({ viewport: mobileViewport, hasTouch: true, isMobile: true });
    try {
      const touchPage = await context.newPage();
      await touchPage.goto(storyUrl("mobile-populated"));
      const touchEdit = touchPage.locator('[data-test-id="edit-description"]');
      const touchBounds = await boundsOf(touchEdit);
      await touchPage.touchscreen.tap(touchBounds.x + 4, touchBounds.y + 4);
      await touchPage.locator(".tiptap[contenteditable=true]").waitFor();
    } finally {
      await context.close();
    }
    assert.ok(bounds.height >= 44);

    await editDescription.click();
    await assertTouchSize(page.getByRole("button", { name: "Save", exact: true }));
    await assertTouchSize(page.getByRole("button", { name: "Cancel", exact: true }));
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    const update = page.locator('[data-test-id^="update-target-"]').first();
    await assertTouchSize(update);
    await update.click();
    await page.locator('[data-test-id="target-value"]').waitFor();
    await assertTouchSize(page.locator('[data-test-id="cancel"]'));
    await assertTouchSize(page.locator('[data-test-id="save"]'));
    await assertNoHorizontalOverflow();
  });

  test("related-work actions wrap when labels take more space", async () => {
    await page.setViewportSize(mobileViewport);
    await page.goto(storyUrl("mobile-populated"));
    const addGoal = page.locator('[data-test-id="add-subgoal"]');
    const addProject = page.locator('[data-test-id="add-project"]');
    await addGoal.evaluate((element) => {
      element.textContent = "Create another goal with a longer label";
    });
    await addProject.evaluate((element) => {
      element.textContent = "Add a project with a longer label";
    });

    const goalBounds = await assertTouchSize(addGoal);
    const projectBounds = await assertTouchSize(addProject);
    assert.ok(projectBounds.y >= goalBounds.y + goalBounds.height + 8);
    assert.ok(mobileViewport.width - (projectBounds.x + projectBounds.width) >= 16);
    await assertNoHorizontalOverflow();
  });

  test("target edit and delete forms keep their actions touch-sized", async () => {
    await page.setViewportSize(mobileViewport);
    await page.goto(storyUrl("mobile-populated"));

    await page.locator('[data-test-id^="target-"]').first().click();
    const edit = page.locator('[data-test-id^="edit-target-"]').first();
    const remove = page.locator('[data-test-id="delete-target"]').first();
    await assertTouchSize(edit);
    await assertTouchSize(remove);
    await assertSeparateActions(edit, remove);

    await edit.click();
    await page.locator('[data-test-id="target-name"]').waitFor();
    await assertTouchSize(page.locator('[data-test-id="save"]'));
    await assertTouchSize(page.getByRole("button", { name: "Cancel", exact: true }));
    await page.getByRole("button", { name: "Cancel", exact: true }).click();

    await page.locator('[data-test-id^="target-"]').first().click();
    await page.locator('[data-test-id="delete-target"]').first().click();
    await assertTouchSize(page.locator('[data-test-id="confirm"]'));
    await assertTouchSize(page.getByRole("button", { name: "Cancel", exact: true }));
    await assertNoHorizontalOverflow();
  });

  test("check-in and discussion actions fit their mobile tabs", async () => {
    await page.setViewportSize(mobileViewport);
    await page.goto(storyUrl("mobile-empty"));
    await page.locator('[data-test-id="tab-check-ins"]').click();
    const checkIn = page.locator('[data-test-id="check-in-button"]');
    await assertTouchSize(checkIn);
    await assertNoHorizontalOverflow();

    await page.locator('[data-test-id="tab-discussions"]').click();
    const discussion = page.locator('[data-test-id="start-discussion"]');
    await assertTouchSize(discussion);
    await assertNoHorizontalOverflow();
  });

  test("desktop keeps compact actions and related work inline; read-only hides edit actions", async () => {
    await page.setViewportSize(desktopViewport);
    await page.goto(storyUrl("mobile-populated"));
    const addGoal = await boundsOf(page.locator('[data-test-id="add-subgoal"]'));
    const addProject = await boundsOf(page.locator('a[href="/projects/new?goalId=goal-1&spaceId=space-1"]'));
    const heading = await boundsOf(page.locator('[data-test-id="related-work-section"] h2'));
    assert.ok(addGoal.height < 44);
    assert.ok(addProject.height < 44);
    assert.ok(addGoal.y < heading.y + heading.height);

    await page.goto(storyUrl("default-read-only"));
    assert.equal(await page.locator('[data-test-id="add-target"]').count(), 0);
    assert.equal(await page.locator('[data-test-id="add-checklist-item"]').count(), 0);
    assert.equal(await page.locator('[data-test-id="add-subgoal"]').count(), 0);
    assert.equal(await page.locator('[data-test-id="edit-description"]').count(), 0);
  });
});
