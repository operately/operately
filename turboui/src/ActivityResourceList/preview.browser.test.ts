import assert from "node:assert/strict";
import type { Page } from "playwright";

declare const page: Page;

for (const resource of ["tasks", "milestones"]) {
  for (const width of [1280, 375]) {
    for (const theme of ["light", "dark"]) {
      test(`${resource} compact preview at ${width}px in ${theme} theme`, async () => {
        await page.setViewportSize({ width, height: 900 });
        const url = new URL("iframe.html", process.env.TARGET_URL);
        const storyId = `components-activityresourcelist--thirty-${resource}`;
        url.searchParams.set("id", storyId);
        url.searchParams.set("viewMode", "story");
        url.searchParams.set("globals", `theme:${theme}`);
        await page.goto(url.href);
        const list = page.locator('[data-test-id="activity-resource-list"]');
        const toggle = list.getByRole("button");
        await toggle.waitFor();
        await page.waitForFunction(
          () => document.querySelector('[data-test-id="activity-resource-toggle"]')?.textContent === "Show 27 more",
        );
        await page.waitForFunction((theme) => {
          const link = document.querySelector('[data-test-id="activity-resource-list"] a');
          return link && getComputedStyle(link).color !== "rgb(0, 0, 0)" && document.body.classList.contains(theme);
        }, theme);
        assert.equal(await list.getByRole("link").count(), 3);
        assert.equal(await toggle.innerText(), "Show 27 more");
        const names = await list.getByRole("link").allTextContents();
        const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        assert.ok(await noOverflow());
        if (process.env.SCREENSHOTS_DIR) {
          await page.screenshot({
            path: `${process.env.SCREENSHOTS_DIR}/activity-${resource}-${width}-${theme}-after.png`,
            animations: "disabled",
          });
        }
        await toggle.focus();
        await page.keyboard.press("Enter");
        assert.equal(await list.getByRole("link").count(), 30);
        assert.equal(await toggle.getAttribute("aria-expanded"), "true");
        assert.ok(await toggle.evaluate((element) => document.activeElement === element));
        assert.ok(await noOverflow());
        const expandedNames = await list.getByRole("link").allTextContents();
        assert.deepEqual(expandedNames.slice(0, 3), names);
        assert.ok(expandedNames.some((name) => name.includes("Task <literal>, punctuation & names")));

        if (process.env.SCREENSHOTS_DIR && width === 1280) {
          // Reproduce the former unbounded name-list presentation for comparison.
          await toggle.evaluate((element) => {
            (element as HTMLElement).style.opacity = "0";
          });
          await page.screenshot({
            path: `${process.env.SCREENSHOTS_DIR}/activity-${resource}-${width}-${theme}-before.png`,
            fullPage: true,
            animations: "disabled",
          });
          await toggle.evaluate((element) => {
            (element as HTMLElement).style.opacity = "";
          });
        }

        // Storybook's args update models the app changing its effective locale,
        // without remounting the resource preview or resetting expansion.
        await page.evaluate(
          ({ storyId }) => {
            const channel = (
              window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: { emit: (event: string, payload: unknown) => void } }
            ).__STORYBOOK_ADDONS_CHANNEL__;
            channel.emit("updateStoryArgs", { storyId, updatedArgs: { locale: "pt-BR" } });
          },
          { storyId },
        );
        await page.waitForFunction(
          () => document.querySelector('[data-test-id="activity-resource-toggle"]')?.textContent === "Mostrar menos",
        );
        assert.equal(await list.getByRole("link").count(), 30);
        assert.deepEqual(await list.getByRole("link").allTextContents(), expandedNames);
        assert.ok(await noOverflow());
        await toggle.focus();
        await page.keyboard.press("Space");
        assert.equal(await list.getByRole("link").count(), 3);
        assert.equal(await toggle.innerText(), "Mostrar mais 27");
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
        assert.ok((await list.innerText()).includes(" e "));
        assert.ok(await noOverflow());
      });
    }
  }
}
