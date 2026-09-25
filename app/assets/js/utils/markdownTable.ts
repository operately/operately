import { Mark, Node } from "prosemirror-model";

const markOrder = ["link", "bold", "italic", "strike", "highlight", "code"];
const delimiters: Record<string, string> = { bold: "**", italic: "_", strike: "~~" };

/** Canonical pipe-table output; keep aligned with Operately.MD.Table and the shared fixtures. */
export function renderMarkdownTable(table: Node): string {
  const rows = Array.from(table.content.content);
  if (rows.length === 0) return "";

  const width = Math.max(...rows.map((row) => row.childCount));
  const rendered = rows.map((row) => Array.from(row.content.content).map(renderCell));
  const hasHeader =
    rows[0]?.firstChild?.type.name === "tableHeader" &&
    Array.from(rows[0].content.content).every((cell) => cell.type.name === "tableHeader");
  const header = hasHeader ? (rendered.shift() ?? []) : [];
  return [header, Array<string>(width).fill("---"), ...rendered]
    .map((cells) => `| ${Array.from({ length: width }, (_, index) => cells[index] ?? "").join(" | ")} |`)
    .join("\n");
}

function renderCell(cell: Node): string {
  return Array.from(cell.content.content)
    .map((paragraph) => renderInline(Array.from(paragraph.content.content), markOrder))
    .join("<br>")
    .replace(/\|/g, "\\|");
}

function renderInline(nodes: Node[], kinds: string[]): string {
  const [kind, ...rest] = kinds;
  if (!kind) return nodes.map(renderLeaf).join("");

  // Keep shared marks open across adjacent nodes, including partially overlapping marks.
  const groups: { mark?: Mark; nodes: Node[] }[] = [];

  for (const node of nodes) {
    const mark = node.type.name === "blob" ? undefined : node.marks.find((candidate) => candidate.type.name === kind);
    const last = groups.at(-1);
    if (last && (last.mark === mark || (mark && last.mark?.eq(mark)))) {
      last.nodes.push(node);
    } else {
      groups.push({ mark, nodes: [node] });
    }
  }

  return groups
    .map(({ mark, nodes: group }) => {
      if (mark?.type.name === "code") return codeSpan(group.map((node) => node.textContent).join(""));
      const text = renderInline(group, rest);
      return mark ? wrapMark(text, mark) : text;
    })
    .join("");
}

function renderLeaf(node: Node): string {
  if (node.type.name === "hardBreak") return "<br>";
  if (node.type.name === "mention") return `@${escapeText(node.attrs.label ?? "")}`;
  if (node.type.name === "blob") {
    const { src, title, alt, filetype } = node.attrs;
    const href = typeof src === "string" ? src : src?.url;
    const label = escapeText(alt || title || "File");
    if (!href) return label;
    const prefix = filetype?.startsWith("image/") ? "!" : "";
    return prefix + renderLink(label, href, title);
  }
  return escapeText(node.text ?? "");
}

function escapeText(text: string): string {
  return text
    .replace(/[\\`*_[\]~]/g, "\\$&")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n?|\n/g, "<br>");
}

function wrapMark(text: string, mark: Mark): string {
  if (mark.type.name === "link") {
    return renderLink(text, mark.attrs.href ?? "", mark.attrs.title);
  }
  const delimiter = delimiters[mark.type.name];
  if (delimiter)
    return text.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_match: string, before: string, body: string, after: string) =>
      body ? `${before}${delimiter}${body}${delimiter}${after}` : text,
    );
  if (mark.type.name === "highlight" && mark.attrs.highlight) {
    return `<!-- highlight: ${escapeText(mark.attrs.highlight)} -->${text}<!-- /highlight -->`;
  }
  return text;
}

function renderLink(text: string, source: string, title?: string | null): string {
  const href = source.replace(/[\s<>"\\()|]/g, (char) => {
    const encoded = encodeURIComponent(char);
    return encoded === char ? `%${char.charCodeAt(0).toString(16).toUpperCase()}` : encoded;
  });
  const suffix = title ? ` "${title.replace(/[\\"]/g, "\\$&").replace(/\r\n?|\n/g, " ")}"` : "";
  return `[${text}](${href}${suffix})`;
}

function codeSpan(text: string): string {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestRun + 1);
  const padding = /^`|`$/.test(text) || (/^ .* $/.test(text) && /[^ ]/.test(text)) ? " " : "";
  return `${fence}${padding}${text.replace(/\r\n?|\n/g, " ")}${padding}${fence}`;
}
