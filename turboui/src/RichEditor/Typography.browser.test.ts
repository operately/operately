import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

declare const page: Page;

const storyUrl = (id: string) => {
  const url = new URL("iframe.html", process.env.TARGET_URL);
  url.searchParams.set("id", id);
  url.searchParams.set("viewMode", "story");
  return url.href;
};

async function openStory(id: string): Promise<Locator> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(storyUrl(id));
  const prose = page.locator(".ProseMirror[contenteditable]").first();
  await prose.locator("h1").waitFor();
  return prose;
}

async function verticalGap(before: Locator, after: Locator): Promise<number> {
  const beforeBox = await before.boundingBox();
  const afterBox = await after.boundingBox();
  assert.ok(beforeBox && afterBox, "Both blocks must have visible bounds");
  return afterBox.y - beforeBox.y - beforeBox.height;
}

const previousBlock = (block: Locator) => block.locator("xpath=preceding-sibling::*[1]");
const nextBlock = (block: Locator) => block.locator("xpath=following-sibling::*[1]");

async function computed(element: Locator, property: string): Promise<string> {
  return element.evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), property);
}

function closeTo(actual: number, expected: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= 1, `${label}: expected ${expected}px, got ${actual}px`);
}

describe("Rich text typography in a browser", () => {
  test.each([
    ["editor", "components-richeditor--typography"],
    ["read view", "components-richcontent--typography"],
  ])("uses the heading hierarchy and paragraph rhythm in the %s", async (_mode, id) => {
    const prose = await openStory(id);
    const headings = [
      ["h1", 28, 36, 0],
      ["h2", 22, 30, 28],
      ["h3", 20, 28, 22],
      ["h4", 18, 28, 18],
    ] as const;

    for (const [tag, size, lineHeight, topMargin] of headings) {
      const heading = prose.locator(tag).first();
      closeTo(parseFloat(await computed(heading, "font-size")), size, `${tag} font size`);
      closeTo(parseFloat(await computed(heading, "line-height")), lineHeight, `${tag} line height`);
      assert.equal(await computed(heading, "font-weight"), "700");
      closeTo(parseFloat(await computed(heading, "margin-top")), topMargin, `${tag} top margin`);
      closeTo(parseFloat(await computed(heading, "margin-bottom")), 8, `${tag} bottom margin`);
      closeTo(parseFloat(await computed(heading, "padding-bottom")), 0, `${tag} bottom padding`);
    }

    const heading = prose.locator("h2");
    closeTo(await verticalGap(previousBlock(heading), heading), 28, "gap above H2");
    closeTo(await verticalGap(heading, nextBlock(heading)), 8, "gap below H2");
  });

  test.each([
    ["18px editor", "components-richeditor--typography", 18],
    ["18px read view", "components-richcontent--typography", 18],
    ["14px read view", "components-richcontent--compact-typography", 14],
  ])("spaces lists, quotes, and code like paragraphs at %s", async (_mode, id, bodySize) => {
    const prose = await openStory(id);
    const paragraphGap = bodySize * 0.75;
    const firstParagraph = prose.locator(":scope > p").first();
    closeTo(parseFloat(await computed(firstParagraph, "font-size")), bodySize, "body font size");
    closeTo(await verticalGap(firstParagraph, nextBlock(firstParagraph)), paragraphGap, "paragraph gap");

    const bulletList = prose.locator("ul").first();
    const numberedList = prose.locator("ol").first();
    const quote = prose.locator("blockquote").first();
    const code = prose.locator(".node-codeBlock").first();
    for (const [block, label] of [
      [bulletList, "bullet list"],
      [numberedList, "numbered list"],
      [quote, "quote"],
      [code, "code block"],
    ] as const) {
      closeTo(parseFloat(await computed(block, "margin-top")), paragraphGap, `${label} top margin`);
      closeTo(parseFloat(await computed(block, "margin-bottom")), paragraphGap, `${label} bottom margin`);
    }
    closeTo(parseFloat(await computed(code.locator("pre").first(), "margin-top")), 0, "inner code top margin");
    closeTo(parseFloat(await computed(code.locator("pre").first(), "margin-bottom")), 0, "inner code bottom margin");

    closeTo(await verticalGap(previousBlock(bulletList), bulletList), paragraphGap, "gap before bullet list");
    closeTo(await verticalGap(bulletList, nextBlock(bulletList)), paragraphGap, "gap after bullet list");
    closeTo(await verticalGap(numberedList, nextBlock(numberedList)), paragraphGap, "gap after numbered list");
    closeTo(await verticalGap(previousBlock(quote), quote), paragraphGap, "gap before quote");
    closeTo(await verticalGap(quote, nextBlock(quote)), paragraphGap, "gap after quote");
    closeTo(
      await verticalGap(quote.locator("p").first(), quote.locator("p").nth(1)),
      paragraphGap,
      "quote paragraph gap",
    );
    closeTo(parseFloat(await computed(quote, "padding-left")), 16, "quote indentation");
    closeTo(await verticalGap(previousBlock(code), code), paragraphGap, "gap before code");
    closeTo(await verticalGap(code, nextBlock(code)), paragraphGap, "gap after code");

    const nestedList = bulletList.locator("ul").first();
    assert.ok(parseFloat(await computed(nestedList, "margin-top")) < paragraphGap);
    const tableParagraphs = prose.locator("td").first().locator("p");
    assert.ok((await verticalGap(tableParagraphs.first(), tableParagraphs.nth(1))) < paragraphGap);
    const checkbox = prose.locator('li[data-type="taskItem"] [role="checkbox"]').first();
    assert.equal(await checkbox.isVisible(), true);
  });

  test("keeps one outer gap around a usable Mermaid preview", async () => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(storyUrl("components-richeditor--mermaid-diagram"));
    const prose = page.locator(".ProseMirror[contenteditable]").first();
    const code = prose.locator(".node-codeBlock");
    await code.waitFor();
    closeTo(parseFloat(await computed(code, "margin-top")), 12, "Mermaid outer top margin at 16px");
    closeTo(parseFloat(await computed(code, "margin-bottom")), 12, "Mermaid outer bottom margin at 16px");
    closeTo(
      parseFloat(await computed(code.locator(".mermaid-code-block"), "margin-top")),
      0,
      "Mermaid inner top margin",
    );
    closeTo(await verticalGap(previousBlock(code), code), 12, "gap before Mermaid");
    closeTo(await verticalGap(code, nextBlock(code)), 12, "gap after Mermaid");
    const preview = code.locator(".mermaid-preview");
    await preview.locator("svg").waitFor();
    await code.getByRole("button", { name: "Edit source" }).click();
    assert.equal(await code.locator(".mermaid-source").isVisible(), true);
    await code.getByRole("button", { name: "Preview" }).click();
    await preview.locator("svg").waitFor();
  });

  test.each(["li", "blockquote", "td"])(
    "keeps compact spacing around Mermaid diagrams inside %s",
    async (container) => {
      await page.goto(storyUrl("components-richeditor--nested-mermaid-diagrams"));
      const code = page.locator(`.ProseMirror ${container} > .node-codeBlock`);
      await code.locator(".mermaid-preview svg").waitFor();
      closeTo(await verticalGap(previousBlock(code), code), 8, "gap before nested Mermaid at 16px");
      closeTo(await verticalGap(code, nextBlock(code)), 8, "gap after nested Mermaid at 16px");
    },
  );

  test.each([
    ["new", "pages-newdocumentpage--default", true],
    ["edit", "pages-documenteditpage--typography", false],
    ["published", "pages-documentpage--typography", false],
  ])("uses normal body weight in the %s document", async (_mode, id, isEmpty) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(storyUrl(id));
    const prose = page.locator(".ProseMirror[contenteditable]").first();
    await prose.waitFor();
    if (isEmpty) await prose.fill("Ordinary document paragraph");
    const paragraph = prose.locator("p").first();
    assert.equal(await computed(paragraph, "font-weight"), "400");
    if (!isEmpty) {
      const bold = prose.locator("strong").first();
      assert.ok(parseFloat(await computed(bold, "font-weight")) >= 700);
    }
  });
});
