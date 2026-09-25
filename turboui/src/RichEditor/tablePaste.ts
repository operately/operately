/** Normalize pasted tables before ProseMirror can discard unsupported cell content. */
export function normalizeTableHtml(html: string, insideTable = false): string {
  // Leave ordinary HTML alone when pasting outside a table.
  if (!insideTable && !/<table[\s>]/i.test(html)) return html;

  // Parse into a detached document so we can normalize the markup.
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Existing cells accept inline content; flatten pasted blocks and nested tables.
  if (insideTable) return cellParagraph(doc.body).outerHTML;

  // Process outer tables only; their nested tables are flattened during normalization.
  const tables = Array.from(doc.querySelectorAll("table")).filter((table) => !table.parentElement?.closest("table"));

  for (const table of tables) {
    // Expand merged cells, pad short rows, and normalize each cell's content.
    const normalized = rectangularTable(table);
    const caption = table.querySelector(":scope > caption");

    // Move captions above the grid; text-only fallbacks already include them.
    if (caption && normalized.tagName === "TABLE") table.before(cellParagraph(caption));

    table.replaceWith(normalized);
  }

  // Return the normalized markup with surrounding content preserved.
  return doc.body.innerHTML;
}

function ownRows(table: Element): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll("tr")).filter((row) => row.closest("table") === table);
}

function ownCells(row: Element): Element[] {
  return Array.from(row.children).filter((cell) => cell.tagName === "TD" || cell.tagName === "TH");
}

/** Normalize cells into a rectangular grid, expanding merged spans and padding gaps with empty cells. */
function rectangularTable(source: Element): Element {
  const doc = source.ownerDocument;
  const rows = ownRows(source);
  const grid: (Element | undefined)[][] = rows.map(() => []);
  // Only a complete first header row is supported; header columns and later headers become data cells.
  const header = ownCells(rows[0] ?? doc.createElement("tr")).every((cell) => cell.tagName === "TH");
  let width = 0;

  for (const [rowIndex, row] of rows.entries()) {
    const target = grid[rowIndex];

    if (!target) continue;

    let column = 0;

    for (const cell of ownCells(row)) {
      const colspan = span(cell, "colspan", 1000);
      const rowspan = span(cell, "rowspan", rows.length - rowIndex);

      // Find a contiguous free range, including columns occupied by earlier row spans.
      while (Array.from({ length: colspan }, (_, offset) => target[column + offset]).some(Boolean)) column++;

      if ((column + colspan) * rows.length > 10000) return flattenTable(source);

      for (let y = 0; y < rowspan; y++) {
        for (let x = 0; x < colspan; x++) {
          const destination = grid[rowIndex + y];

          if (!destination) continue;

          const output = doc.createElement(header && rowIndex + y === 0 ? "th" : "td");
          output.append(y === 0 && x === 0 ? cellParagraph(cell) : doc.createElement("p"));
          destination[column + x] = output;
        }
      }

      column += colspan;
      width = Math.max(width, column);
    }
  }

  if (!width) return flattenTable(source);
  const table = doc.createElement("table");

  for (const [index, cells] of grid.entries()) {
    const row = doc.createElement("tr");
    for (let column = 0; column < width; column++) {
      const cell = cells[column] ?? doc.createElement(header && index === 0 ? "th" : "td");

      if (!cell.firstChild) cell.append(doc.createElement("p"));
      row.append(cell);
    }
    table.append(row);
  }

  return table;
}

function span(cell: Element, name: string, maximum: number): number {
  const value = Number(cell.getAttribute(name) ?? 1);
  if (name === "rowspan" && value === 0) return maximum;
  return Number.isInteger(value) && value > 0 ? Math.min(value, maximum) : 1;
}

function flattenTable(table: Element): HTMLParagraphElement {
  const paragraph = table.ownerDocument.createElement("p");
  const caption = table.querySelector(":scope > caption");

  if (caption) {
    paragraph.append(...Array.from(cellParagraph(caption).childNodes));
    lineBreak(paragraph);
  }

  ownRows(table).forEach((row, rowIndex) => {
    if (rowIndex) paragraph.append(table.ownerDocument.createElement("br"));
    ownCells(row).forEach((cell, cellIndex) => {
      if (cellIndex) paragraph.append(" | ");
      paragraph.append(...Array.from(cellParagraph(cell).childNodes));
    });
  });
  return paragraph;
}

/** Flatten cell content into one paragraph, preserving inline formatting and block breaks without trailing breaks. */
function cellParagraph(cell: Element): HTMLParagraphElement {
  const paragraph = cell.ownerDocument.createElement("p");

  for (const child of Array.from(cell.childNodes)) appendInline(paragraph, child);

  while (paragraph.lastChild?.nodeName === "BR") paragraph.lastChild.remove();

  return paragraph;
}

const BLOCKS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "PRE",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "FIGURE",
  "FIGCAPTION",
  "DL",
  "DT",
  "DD",
  "HR",
]);
const INLINE = new Set(["STRONG", "B", "EM", "I", "S", "STRIKE", "DEL", "CODE", "A", "BR"]);

function appendInline(target: Element, node: Node): void {
  const doc = target.ownerDocument;

  if (node.nodeType === Node.TEXT_NODE) {
    target.append(doc.createTextNode(node.textContent ?? ""));
    return;
  }

  if (!(node instanceof Element) || ["SCRIPT", "STYLE", "TEMPLATE"].includes(node.tagName)) return;

  if (node.tagName === "TABLE") {
    lineBreak(target);
    target.append(...Array.from(flattenTable(node).childNodes));
    lineBreak(target);
    return;
  }

  if (node.tagName === "IMG") {
    const link = doc.createElement("a");
    link.textContent = node.getAttribute("alt") || node.getAttribute("title") || "Image";
    link.setAttribute("href", node.getAttribute("src") ?? "");
    target.append(link);
    return;
  }

  if (BLOCKS.has(node.tagName)) lineBreak(target);

  let output = target;

  if (INLINE.has(node.tagName) || node.getAttribute("data-type") === "mention") {
    output = doc.createElement(node.tagName.toLowerCase());
    for (const name of ["href", "title", "data-type", "data-id", "data-label"]) {
      const value = node.getAttribute(name);
      if (value != null) output.setAttribute(name, value);
    }
    target.append(output);
  }

  // Office/Google Docs often encode inline formatting as styles on spans.
  const style = node instanceof HTMLElement ? node.style : null;
  const marks = [
    [/^(bold|[6-9]00)$/.test(style?.fontWeight ?? ""), "strong"],
    [style?.fontStyle === "italic", "em"],
    [style?.textDecoration.includes("line-through"), "s"],
  ] as const;

  for (const [active, tag] of marks) {
    if (!active) continue;
    const mark = doc.createElement(tag);
    output.append(mark);
    output = mark;
  }

  for (const child of Array.from(node.childNodes)) appendInline(output, child);

  if (BLOCKS.has(node.tagName)) lineBreak(target);
}

function lineBreak(target: Element) {
  if (target.lastChild && target.lastChild.nodeName !== "BR") target.append(target.ownerDocument.createElement("br"));
}
