import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { JSDOM } from "jsdom";
import { marked } from "marked";

const extensions = [
  StarterKit.configure({
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

function setupDOMEnvironment() {
  const dom = new JSDOM("");
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).DOMParser = dom.window.DOMParser;
  
  if (!(global as any).navigator) {
    Object.defineProperty(global, 'navigator', {
      value: dom.window.navigator,
      configurable: true,
      writable: true,
    });
  }
}

function cleanupDOMEnvironment() {
  delete (global as any).window;
  delete (global as any).document;
  delete (global as any).DOMParser;
  
  try {
    delete (global as any).navigator;
  } catch {
    // Navigator might be read-only in some environments
  }
}

export function convertMarkdownToTiptap(markdown: string): Record<string, unknown> {
  if (!markdown || markdown.trim() === "") {
    return {
      type: "doc",
      content: [],
    };
  }

  try {
    setupDOMEnvironment();
    const html = marked.parse(markdown) as string;
    const json = generateJSON(html, extensions);
    cleanupDOMEnvironment();
    return json as Record<string, unknown>;
  } catch (error) {
    cleanupDOMEnvironment();
    throw new Error(`Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`);
  }
}
