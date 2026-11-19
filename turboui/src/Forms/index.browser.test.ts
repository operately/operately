import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

function storyUrl() {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", "components-forms-project-pickers--long-names");
  url.searchParams.set("viewMode", "story");
  return url.href;
}

function field(name: string) {
  return page.locator(`[data-test-id="${name}"]`);
}

// Measure actual rendered text, including every line of an unbroken name.
// DOM textContent alone also passes when react-select clips the selected value.
async function assertReadable(label: Locator) {
  await label.waitFor();
  const failures = await label.evaluate((element) => {
    const failures: string[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        let ancestor = node.parentElement;
        while (ancestor) {
          const bounds = ancestor.getBoundingClientRect();
          const style = getComputedStyle(ancestor);
          if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) {
            failures.push(`Text extends outside ${ancestor.tagName}: ${node.textContent}`);
          }
          if (
            ["hidden", "clip"].includes(style.overflowY) &&
            (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)
          ) {
            failures.push(`Text is vertically clipped: ${node.textContent}`);
          }
          if (ancestor.getAttribute("role") === "option" || ancestor.tagName === "FORM") break;
          ancestor = ancestor.parentElement;
        }
      }
    }
    return failures;
  });
  assert.equal(failures.length, 0, failures.join("\n"));
}

async function assertFormFits() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  const form = await page.locator("form").boundingBox();
  assert.ok(form);
  for (const name of ["space", "champion", "reviewer"]) {
    const bounds = await field(name).boundingBox();
    assert.ok(bounds && bounds.x >= form.x && bounds.x + bounds.width <= form.x + form.width + 1);
    const indicator = await field(name).locator("svg").last().boundingBox();
    assert.ok(indicator && indicator.width > 0 && indicator.x + indicator.width <= bounds.x + bounds.width);
  }
}

async function assertPeopleReadable(name: string) {
  const labels = field(name).locator('[data-test-id^="person-option-"]');
  for (const label of await labels.all()) {
    await assertReadable(label);
    if ((await label.locator("[title]").count()) === 0) continue;
    const avatar = await label.locator("[title]").boundingBox();
    assert.ok(avatar && avatar.width === 20 && avatar.height === 20);
    const textLeft = await label.evaluate((element) => {
      const node = Array.from(element.childNodes).find(
        (node) => node.textContent?.trim() && !(node instanceof Element && node.hasAttribute("title")),
      );
      if (!node) throw new Error("Person name missing");
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getClientRects()[0]?.left;
    });
    assert.ok(textLeft && textLeft >= avatar.x + avatar.width);
  }
}

describe("project form pickers in a browser", () => {
  for (const width of [374, 1280]) {
    test(`names fit options and selected values at ${width}px`, async () => {
      page.setDefaultTimeout(5000);
      await page.setViewportSize({ width, height: 812 });
      await page.goto(storyUrl());
      await field("champion").locator('[data-test-id^="person-option-"]').waitFor();
      await assertReadable(
        field("space").getByText("International Customer Research and Development — Europe", { exact: true }),
      );
      await assertPeopleReadable("champion");
      await assertPeopleReadable("reviewer");
      await assertFormFits();
      const champion = await field("champion").boundingBox();
      const reviewerBounds = await field("reviewer").boundingBox();
      assert.ok(champion && reviewerBounds);
      if (width === 374) {
        assert.ok(reviewerBounds.y >= champion.y + champion.height, "People fields stack on mobile");
        assert.equal(reviewerBounds.x, champion.x);
        assert.equal(reviewerBounds.width, champion.width);
      } else {
        assert.equal(reviewerBounds.y, champion.y, "People fields share a row on desktop");
        assert.ok(reviewerBounds.x >= champion.x + champion.width);
      }

      await field("space").getByRole("combobox").click();
      const spaceOptions = page.getByRole("option");
      await spaceOptions.first().waitFor();
      for (const option of await spaceOptions.all()) await assertReadable(option);
      await spaceOptions.nth(2).click();
      await assertReadable(
        field("space").getByText("InternationalCustomerResearchAndDevelopmentOperations", { exact: true }),
      );

      await field("champion").getByRole("combobox").click();
      await page.getByRole("option").first().waitFor();
      await assertPeopleReadable("champion");
      await page.getByRole("option").nth(1).click();
      await field("champion").getByText("Alexandra Catherine Montgomery Robertson", { exact: true }).waitFor();
      await assertPeopleReadable("champion");

      const reviewer = field("reviewer").getByRole("combobox");
      await reviewer.fill("AlexandraCatherine");
      await page.getByRole("option").first().waitFor();
      assert.equal(await page.getByRole("option").count(), 2); // Matching person and empty selection.
      await assertPeopleReadable("reviewer");
      await reviewer.press("Home");
      await reviewer.press("Enter");
      await field("reviewer").getByText("AlexandraCatherineMontgomeryRichardson", { exact: true }).waitFor();
      await assertPeopleReadable("reviewer");
      await assertFormFits();

      await field("space").getByRole("combobox").fill("Design");
      await page.getByRole("option").click();
      await field("champion").getByRole("combobox").fill("Sam Lee");
      await page.getByRole("option").click();
      await reviewer.fill("Sam Lee");
      await page.getByRole("option", { name: /Sam Lee/ }).click();
      const compact = await field("champion").boundingBox();
      assert.ok(compact && compact.height <= 44);
      await assertFormFits();
    });
  }

  test("touch users can select long space and person names", async () => {
    const browser = page.context().browser();
    assert.ok(browser);
    const context = await browser.newContext({ viewport: { width: 374, height: 812 }, hasTouch: true, isMobile: true });
    try {
      const touchPage = await context.newPage();
      await touchPage.goto(storyUrl());
      await touchPage.locator('[data-test-id="space"]').getByRole("combobox").tap();
      const space = touchPage.getByRole("option").nth(1);
      await assertReadable(space);
      await space.tap();
      await assertReadable(
        touchPage.getByText("International Customer Research and Development — Americas", { exact: true }),
      );
      await touchPage.getByRole("combobox", { name: "Champion", exact: true }).tap();
      const person = touchPage.getByRole("option", { name: /Montgomery Robertson/ });
      await assertReadable(person);
      await person.tap();
      await assertReadable(
        touchPage
          .locator('[data-test-id="champion"]')
          .getByText("Alexandra Catherine Montgomery Robertson", { exact: true }),
      );
    } finally {
      await context.close();
    }
  });
});
