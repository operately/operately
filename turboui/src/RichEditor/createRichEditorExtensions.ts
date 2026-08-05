import type { Extensions } from "@tiptap/core";
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

const starterKitExtension = StarterKit.configure({
  link: false,
  // Only expose H1/H2 markdown input rules ("# ", "## "), matching the
  // H1Button/H2Button in the toolbar. No toolbar button exists for H3+.
  heading: {
    levels: [1, 2],
  },
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
