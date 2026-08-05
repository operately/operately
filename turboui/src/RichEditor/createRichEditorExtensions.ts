import type { Extensions } from "@tiptap/core";
import { textblockTypeInputRule } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";

import Blob from "./Blob";
import FakeTextSelection from "./extensions/FakeTextSelection";
import Highlight from "./extensions/Highlight";
import { mentionExtensions } from "./mentionExtensions";
import type { RichEditorHandlers } from "./useEditor";

export type CreateRichEditorExtensionsOptions = {
  editable?: boolean;
  placeholder?: string;
};

// Levels that get a markdown input rule ("# ", "## "), matching the
// H1Button/H2Button in the toolbar. No toolbar button exists for H3+.
const TOOLBAR_HEADING_LEVELS = [1, 2];

// Keep the full heading schema (levels 1–6) so existing H3+ content still
// renders and round-trips correctly, but only expose H1/H2 markdown input
// rules. Restricting `StarterKit`'s `heading.levels` instead would change the
// schema and downcast existing H3+ headings to H1 on render.
const headingExtension = Heading.extend({
  addInputRules() {
    const min = Math.min(...TOOLBAR_HEADING_LEVELS);
    return TOOLBAR_HEADING_LEVELS.map((level) =>
      textblockTypeInputRule({
        find: new RegExp(`^(#{${min},${level}})\\s$`),
        type: this.type,
        getAttributes: { level },
      }),
    );
  },
});

const starterKitExtension = StarterKit.configure({
  link: false,
  // Provide our own Heading (below) with H1/H2-only input rules.
  heading: false,
  bulletList: {
    keepMarks: true,
    keepAttributes: false,
  },
  orderedList: {
    keepMarks: true,
    keepAttributes: false,
  },
  dropcursor: false,
});

// `markdownLinks` enables the Discord-style "[label](https://example.com)"
// input rule. Its companion paste rule is suppressed via the editor's
// `enablePasteRules` option (see useEditor) so pasted markdown stays literal.
const linkExtension = Link.extend({ inclusive: false }).configure({
  openOnClick: false,
  markdownLinks: true,
});

/**
 * Pure TipTap extension list shared by editable editors, read-only content,
 * and version diffs. Does not create React state or an editor instance.
 */
export function createRichEditorExtensions(
  handlers: Pick<RichEditorHandlers, "peopleSearch" | "uploadFile">,
  options: CreateRichEditorExtensionsOptions = {},
): Extensions {
  const editable = options.editable ?? true;

  const extensions: Extensions = [
    starterKitExtension,
    headingExtension,
    Blob.configure({
      uploadFile: handlers.uploadFile,
      editable,
    }),
    linkExtension,
  ];

  if (options.placeholder != null) {
    extensions.push(Placeholder.configure({ placeholder: options.placeholder }));
  }

  extensions.push(...mentionExtensions(handlers, editable), Highlight, FakeTextSelection);

  return extensions;
}
