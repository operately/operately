//
// Why do we need this?
// When we open the link edit form, or the color picker, we want to
// maintain the selection of the text that the user has selected.
//
// Unfortunately, the ProseMirror library does not provide a way to
// maintain the selection of the text when we open a popover, because
// the selection is lost when the focus is moved to the popover.
//
// To work around this, we are going to add a fake text selection to
// the editor when the link edit form or the color picker is opened.
//
// The fake selection is a highlight that is added to the text that
// the user has selected. This is a blue highlight that is added to
// the text, and it is removed when the link edit form or the color
// picker is closed.
//

import { Mark, mergeAttributes } from "@tiptap/core";

export interface FakeTextSelectionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fakeTextSelection: {
      setFakeTextSelection: () => ReturnType;
      unsetFakeTextSelection: () => ReturnType;
    };
  }
}

export const FakeTextSelection = Mark.create<FakeTextSelectionOptions>({
  name: "fakeTextSelection",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fakeTextSelection: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-focused"),
        renderHTML: () => {
          return {
            style: "background-color: rgba(66, 153, 225, 0.5)",
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
      setFakeTextSelection:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name, { focused: true });
        },
      unsetFakeTextSelection:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default FakeTextSelection;
