import { normalizeTableHtml } from "./tablePaste";

function parse(html: string) {
  return new DOMParser().parseFromString(normalizeTableHtml(html), "text/html");
}

it("expands merged cells and pads short rows without moving their content", () => {
  const doc = parse(
    '<p>Before</p><table><tr><th colspan="2">Heading</th><th>Last</th></tr><tr><td rowspan="2">A</td><td>B</td><td>C</td></tr><tr><td>D</td></tr></table><p>After</p>',
  );
  const rows = Array.from(doc.querySelectorAll("tr"));
  expect(rows.map((row) => Array.from(row.children).map((cell) => cell.textContent))).toEqual([
    ["Heading", "", "Last"],
    ["A", "B", "C"],
    ["", "D", ""],
  ]);
  expect(doc.querySelectorAll("th")).toHaveLength(3);
  expect(doc.querySelectorAll("[colspan], [rowspan]")).toHaveLength(0);
  expect(doc.body.firstElementChild?.textContent).toBe("Before");
  expect(doc.body.lastElementChild?.textContent).toBe("After");
});

it("flattens nested tables, lists and attachments while retaining inline formatting and mentions", () => {
  const doc = parse(
    '<table style="width:900px"><tr><td><h2>Title</h2><ul><li><strong>First</strong></li><li>Second</li></ul><table><tr><td>Inner A</td><td>Inner B</td></tr></table><img src="/image.png" alt="Diagram"><p><a href="https://example.com">Link</a> <span data-type="mention" data-id="alice" data-label="Alice">Alice</span></p></td></tr></table>',
  );
  expect(doc.querySelectorAll("table")).toHaveLength(1);
  expect(doc.querySelector("td")?.textContent).toContain("Inner A | Inner B");
  expect(doc.querySelector("strong")?.textContent).toBe("First");
  expect(doc.querySelector('a[href="/image.png"]')?.textContent).toBe("Diagram");
  expect(doc.querySelector('[data-type="mention"]')?.getAttribute("data-id")).toBe("alice");
  expect(doc.querySelectorAll("ul, li, h2, img, [style]")).toHaveLength(0);
  expect(doc.querySelectorAll("br").length).toBeGreaterThan(2);
});

it("preserves ordinary HTML and is idempotent for tables", () => {
  const ordinary = '<p><strong>Text</strong><img src="/outside.png"></p>';
  expect(normalizeTableHtml(ordinary)).toBe(ordinary);
  const table = "<table><tr><td><p>One</p><p>Two</p></td><td></td></tr></table>";
  expect(normalizeTableHtml(normalizeTableHtml(table))).toBe(normalizeTableHtml(table));
});

it("preserves captions as readable text, including on nested tables", () => {
  const doc = parse(
    "<table><caption>Sales</caption><tr><td><table><caption>Quarter</caption><tr><td>42</td></tr></table></td></tr></table>",
  );
  expect(doc.body.firstElementChild?.textContent).toBe("Sales");
  expect(doc.querySelector("td")?.textContent).toBe("Quarter42");
});

it("keeps text from unsupported block and non-HTML elements readable", () => {
  const doc = parse(
    "<table><tr><td><section>First</section><section>Second</section><math><mi>x</mi></math></td></tr></table>",
  );
  expect(doc.querySelector("p")?.innerHTML).toBe("First<br>Second<br>x");
});
