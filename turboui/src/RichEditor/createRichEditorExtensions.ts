import type { Extensions } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { tableExtensions } from "./extensions/Table";
import { TaskItemExtension } from "./extensions/TaskItem";

import Blob from "./Blob";
import FakeTextSelection from "./extensions/FakeTextSelection";
import { HeadingExtension } from "./extensions/Heading";
import Highlight from "./extensions/Highlight";
import { LinkExtension } from "./extensions/Link";
import { mentionExtensions } from "./mentionExtensions";
import type { RichEditorHandlers } from "./useEditor";

export type CreateRichEditorExtensionsOptions = {
  editable?: boolean;
  placeholder?: string;
  thumbnailBlobs?: boolean;
};

const starterKitExtension = StarterKit.configure({
  link: false,
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
  handlers: Pick<RichEditorHandlers, "peopleSearch" | "uploadFile">,
  options: CreateRichEditorExtensionsOptions = {},
): Extensions {
  const editable = options.editable ?? true;

  const extensions: Extensions = [
    starterKitExtension,
    ...tableExtensions,
    TaskList.configure({ HTMLAttributes: { class: "!list-none !pl-0" } }),
    TaskItemExtension,
    HeadingExtension,
    Blob.configure({
      uploadFile: handlers.uploadFile,
      editable,
      thumbnail: options.thumbnailBlobs,
    }),
    LinkExtension,
  ];

  if (options.placeholder != null) {
    extensions.push(Placeholder.configure({ placeholder: options.placeholder }));
  }

  extensions.push(...mentionExtensions(handlers, editable), Highlight, FakeTextSelection);

  return extensions;
}
