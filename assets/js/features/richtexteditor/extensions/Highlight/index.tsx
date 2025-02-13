//
// This is a custom extension for the Tiptap editor that allows for highlighting text.
// The code is based on the default highlight extension provided by Tiptap, but
// with some modifications to allow for multiple colors that work with both
// dark and light themes.
//
import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

export interface HighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: (attrs: { highlight: string }) => ReturnType;
      toggleHighlight: (attrs: { highlight: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

//
// Matches a highlight to a ==highlight== on input or paste.
//
const inputRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))$/;
const pasteRegex = /(?:^|\s)(==(?!\s+==)((?:[^=]+))==(?!\s+==))/g;

export const Highlight = Mark.create<HighlightOptions>({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      highlight: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-highlight"),
        renderHTML: (attributes) => {
          console.log(attributes);
          if (!attributes.highlight) {
            return {};
          }

          return {
            "data-highlight": attributes.highlight,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight:
        (attrs) =>
        ({ commands }) => {
          return commands.setMark(this.name, attrs);
        },
      toggleHighlight:
        (attrs) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attrs);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight({ highlight: "textYellow" }),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ];
  },
});

export default Highlight;
