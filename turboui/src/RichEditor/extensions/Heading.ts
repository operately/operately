import { textblockTypeInputRule } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";

export const EDITOR_HEADING_LEVELS = [2, 3, 4] as const;
const MARKDOWN_HEADING_LEVELS = [1, ...EDITOR_HEADING_LEVELS] as const;

// Preserve all heading levels in stored content; limit only toolbar controls
// and keyboard shortcuts so existing headings still render and round-trip correctly.
export const HeadingExtension = Heading.extend({
  addInputRules() {
    return MARKDOWN_HEADING_LEVELS.map((level) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{${level}})\\s$`),
        type: this.type,
        getAttributes: { level },
      }),
    );
  },

  addKeyboardShortcuts() {
    return Object.fromEntries(
      EDITOR_HEADING_LEVELS.map((level) => [`Mod-Alt-${level}`, () => this.editor.commands.toggleHeading({ level })]),
    );
  },
});
