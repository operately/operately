import type { Extensions } from "@tiptap/core";
import { Placeholder, type PlaceholderOptions } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { tableExtensions } from "./extensions/Table";
import { TaskItemExtension } from "./extensions/TaskItem";

import { InlineComments, type InlineCommentsOptions } from "./extensions/InlineComments";

import Blob from "./Blob";
import FakeTextSelection from "./extensions/FakeTextSelection";
import { HeadingExtension } from "./extensions/Heading";
import Highlight from "./extensions/Highlight";
import { LinkExtension } from "./extensions/Link";
import { AutoLinkSuppression } from "./extensions/Link/AutoLinkSuppression";
import { mentionExtensions } from "./mentionExtensions";
import { MentionResources } from "./extensions/MentionResources";
import type { RichEditorHandlers } from "./useEditor";
import { MermaidCodeBlock } from "./extensions/Mermaid";

export type CreateRichEditorExtensionsOptions = {
  inlineComments?: InlineCommentsOptions;
  editable?: boolean;
  placeholder?: PlaceholderOptions["placeholder"];
  thumbnailBlobs?: boolean;
  portalContainer?: HTMLElement;
  renderMermaid?: boolean;
};

const starterKitExtension = StarterKit.configure({
  link: false,
  codeBlock: false,
  // Provide our own Heading with shortcuts matching the toolbar.
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

/**
 * Pure TipTap extension list shared by editable editors, read-only content,
 * and version diffs. Does not create React state or an editor instance.
 */
export function createRichEditorExtensions(
  handlers: Pick<RichEditorHandlers, "peopleSearch" | "resourceSearch" | "uploadFile">,
  options: CreateRichEditorExtensionsOptions = {},
): Extensions {
  const editable = options.editable ?? true;

  const extensions: Extensions = [
    starterKitExtension,
    MermaidCodeBlock.configure({ renderMermaid: options.renderMermaid ?? true, enableMermaidPaste: editable }),
    ...tableExtensions,
    TaskList.configure({ HTMLAttributes: { class: "!list-none !pl-0" } }),
    TaskItemExtension,
    HeadingExtension,
    Blob.configure({
      uploadFile: handlers.uploadFile,
      editable,
      thumbnail: options.thumbnailBlobs,
    }),
    AutoLinkSuppression,
    LinkExtension,
  ];

  if (options.placeholder != null) {
    extensions.push(Placeholder.configure({ placeholder: options.placeholder }));
  }

  extensions.push(...mentionExtensions(handlers, editable, options.portalContainer), Highlight, FakeTextSelection);
  if (editable && handlers.resourceSearch) {
    extensions.push(
      MentionResources.configure({ search: handlers.resourceSearch, container: options.portalContainer }),
    );
  }

  if (options.inlineComments) extensions.push(InlineComments.configure(options.inlineComments));

  return extensions;
}
