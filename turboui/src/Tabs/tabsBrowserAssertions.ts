import assert from "node:assert/strict";
import type { Locator } from "playwright";

export async function assertTabsFit(nav: Locator) {
  const layout = await nav.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const items = Array.from(element.children, (child) => child.getBoundingClientRect());
    const text = Array.from(element.querySelectorAll("a > span, button > span"))
      .filter((span) => span.textContent?.trim())
      .flatMap((span) => {
        const range = document.createRange();
        range.selectNodeContents(span);
        return Array.from(range.getClientRects());
      });
    const within = (rect: DOMRect, container: DOMRect) =>
      rect.left >= container.left - 1 &&
      rect.right <= container.right + 1 &&
      rect.top >= container.top - 1 &&
      rect.bottom <= container.bottom + 1;
    const overlaps = items.some((item, index) =>
      items
        .slice(index + 1)
        .some(
          (other) =>
            item.left < other.right - 1 &&
            item.right > other.left + 1 &&
            item.top < other.bottom - 1 &&
            item.bottom > other.top + 1,
        ),
    );

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      navScrollWidth: element.scrollWidth,
      navWidth: element.clientWidth,
      itemsFit: items.every((item) => within(item, bounds)),
      textFits: text.every((rect) => within(rect, bounds)),
      overlaps,
    };
  });

  assert.ok(layout.documentWidth <= layout.viewportWidth + 1, "The tabs must not widen the document");
  assert.ok(layout.navScrollWidth <= layout.navWidth + 1, "The tab row must not scroll horizontally");
  assert.equal(layout.itemsFit, true, "Every tab must fit within its row");
  assert.equal(layout.textFits, true, "Every label and count must be fully visible");
  assert.equal(layout.overlaps, false, "Tabs must not overlap");
}
