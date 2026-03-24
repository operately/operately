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
    hasWindow: 'window' in global,
    hasDocument: 'document' in global,
    hasDOMParser: 'DOMParser' in global,
    hasNavigator: 'navigator' in global,
  };

  const dom = new JSDOM("");
  (global as any).window = dom.window;
  (global as any).document = dom.window.document;
  (global as any).DOMParser = dom.window.DOMParser;
  
  try {
    if (!snapshot.hasNavigator) {
      Object.defineProperty(global, 'navigator', {
        value: dom.window.navigator,
        configurable: true,
        writable: true,
      });
    } else {
      // Try to reassign if writable, otherwise use Object.defineProperty
      try {
        (global as any).navigator = dom.window.navigator;
      } catch {
        Object.defineProperty(global, 'navigator', {
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
    const html = marked.parse(markdown) as string;
    const json = generateJSON(html, extensions);
    cleanupDOMEnvironment(snapshot);
    return json as Record<string, unknown>;
  } catch (error) {
    cleanupDOMEnvironment(snapshot);
    throw new Error(`Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`);
  }
}
