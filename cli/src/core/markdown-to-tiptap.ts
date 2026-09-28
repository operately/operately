import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { JSDOM } from "jsdom";
import { marked, type Token } from "marked";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";

// Match the web cell schema: paragraphs, unit spans, no widths or alignment.
const cellAttributes = () => ({ colspan: { default: 1 }, rowspan: { default: 1 }, colwidth: { default: null } });

const extensions = [
  Table,
  TableRow,
  TableCell.extend({
    content: "paragraph+",
    addAttributes: cellAttributes,
    parseHTML: () => [{ tag: "td", preserveWhitespace: "full" }],
  }),
  TableHeader.extend({
    content: "paragraph+",
    addAttributes: cellAttributes,
    parseHTML: () => [{ tag: "th", preserveWhitespace: "full" }],
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  StarterKit.configure({
    link: false,
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    dropcursor: false,
  }),
  Link.extend({ inclusive: false }).configure({ openOnClick: false }),
  Highlight,
];

interface DOMSnapshot {
  window: any;
  document: any;
  DOMParser: any;
  navigator: any;
  hasWindow: boolean;
  hasDocument: boolean;
  hasDOMParser: boolean;
  hasNavigator: boolean;
}

function setupDOMEnvironment(): DOMSnapshot {
  const snapshot: DOMSnapshot = {
    window: (global as any).window,
    document: (global as any).document,
    DOMParser: (global as any).DOMParser,
    navigator: (global as any).navigator,
    hasWindow: "window" in global,
    hasDocument: "document" in global,
    hasDOMParser: "DOMParser" in global,
    hasNavigator: "navigator" in global,
  };

  const dom = new JSDOM("");
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).DOMParser = dom.window.DOMParser;

  try {
    if (!snapshot.hasNavigator) {
      Object.defineProperty(global, "navigator", {
        value: dom.window.navigator,
        configurable: true,
        writable: true,
      });
    } else {
      // Try to reassign if writable, otherwise use Object.defineProperty
      try {
        (global as any).navigator = dom.window.navigator;
      } catch {
        Object.defineProperty(global, "navigator", {
          value: dom.window.navigator,
          configurable: true,
          writable: true,
        });
      }
    }
  } catch {
    // If all else fails, navigator assignment is not critical for Tiptap
  }

  return snapshot;
}

function cleanupDOMEnvironment(snapshot: DOMSnapshot) {
  if (snapshot.hasWindow) {
    (global as any).window = snapshot.window;
  } else {
    delete (global as any).window;
  }

  if (snapshot.hasDocument) {
    (global as any).document = snapshot.document;
  } else {
    delete (global as any).document;
  }

  if (snapshot.hasDOMParser) {
    (global as any).DOMParser = snapshot.DOMParser;
  } else {
    delete (global as any).DOMParser;
  }

  if (snapshot.hasNavigator) {
    (global as any).navigator = snapshot.navigator;
  } else {
    try {
      delete (global as any).navigator;
    } catch {
      // Navigator might be read-only in some environments
    }
  }
}

export function convertMarkdownToTiptap(markdown: string): Record<string, unknown> {
  if (!markdown || markdown.trim() === "") {
    return {
      type: "doc",
      content: [],
    };
  }

  const snapshot = setupDOMEnvironment();

  try {
    const html = normalizeRichTextHtml(marked.parse(markdown, { walkTokens: validateTable }) as string);
    const json = generateJSON(html, extensions);
    return json as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    cleanupDOMEnvironment(snapshot);
  }
}

function normalizeRichTextHtml(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Images are outside the cell schema; preserve their label and destination as a link.
  for (const image of Array.from(document.querySelectorAll("td img, th img"))) {
    const link = document.createElement("a");
    link.textContent = image.getAttribute("alt") || "Image";
    link.setAttribute("href", image.getAttribute("src") || "");
    if (image.hasAttribute("title")) link.setAttribute("title", image.getAttribute("title") || "");
    image.replaceWith(link);
  }

  // Process inner lists first so splitting mixed task/ordinary lists preserves nesting.
  Array.from(document.querySelectorAll("ul, ol"))
    .reverse()
    .forEach((list) => {
      let group: Element | undefined;
      let previousTask: boolean | undefined;

      Array.from(list.children).forEach((item) => {
        const checkbox = item.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]');
        const isTask = checkbox !== null;

        if (checkbox) {
          item.setAttribute("data-type", "taskItem");
          item.setAttribute("data-checked", checkbox.hasAttribute("checked") ? "true" : "false");
          checkbox.remove();
        }

        if (!group || previousTask !== isTask) {
          group = document.createElement(isTask ? "ul" : list.tagName.toLowerCase());
          if (isTask) group.setAttribute("data-type", "taskList");
          else if (list.hasAttribute("start")) group.setAttribute("start", list.getAttribute("start") ?? "1");
          list.before(group);
        }

        group.append(item);
        previousTask = isTask;
      });

      list.remove();
    });

  const result = document.body.innerHTML;
  dom.window.close();

  return result;
}

/** Marked pads short rows, but truncates long ones: validate raw rows before rendering. */
function validateTable(token: Token): void {
  if (token.type !== "table") return;

  const rows = token.raw.trimEnd().split("\n").slice(2);
  for (const row of rows) {
    // An odd number of backslashes escapes a pipe, including inside inline code.
    const cells = row
      .replace(/\\./g, "x")
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|");
    if (cells.length > token.header.length) {
      throw new Error("Table row has more cells than its header.");
    }
  }
}
