import React from "react";
import * as TipTap from "@tiptap/react";
import { getSchema } from "@tiptap/core";
import type { Extensions, JSONContent } from "@tiptap/core";

import { createRichEditorExtensions } from "../RichEditor/createRichEditorExtensions";
import type { MentionedPersonLookupFn, EditorState } from "../RichEditor/useEditor";
import { EditorContext } from "../RichEditor/EditorContext";
import classNames from "../utils/classnames";

import { buildDiffDecorations } from "./decorations";
import { createDiffDecorationsExtension } from "./diffDecorationsExtension";
import { diffRichContent } from "./diffRichContent";
import type { DiffRichContentResult } from "./types";

export type RichContentDiffProps = {
  before: JSONContent | unknown;
  after: JSONContent | unknown;
  mentionedPersonLookup: MentionedPersonLookupFn;
  className?: string;
};

export { diffRichContent } from "./diffRichContent";
export { createRichContentSchema } from "./schema";
export type { RichContentChange, DiffRichContentResult } from "./types";

const DIFF_STYLES = `
.ProseMirror .diff-removed,
.ProseMirror.diff-pane .diff-removed {
  background-color: rgb(254 226 226);
  color: inherit;
}
.ProseMirror .diff-added,
.ProseMirror.diff-pane .diff-added {
  background-color: rgb(220 252 231);
  color: inherit;
}
.dark .ProseMirror .diff-removed,
.dark .ProseMirror.diff-pane .diff-removed {
  background-color: rgb(127 29 29 / 0.45);
}
.dark .ProseMirror .diff-added,
.dark .ProseMirror.diff-pane .diff-added {
  background-color: rgb(20 83 45 / 0.45);
}
.ProseMirror .diff-removed-block,
.ProseMirror .diff-added-block {
  border-left-width: 3px;
  border-left-style: solid;
  padding-left: 0.5rem;
  margin-left: -0.5rem;
}
.ProseMirror .diff-removed-block {
  border-left-color: rgb(239 68 68);
}
.ProseMirror .diff-added-block {
  border-left-color: rgb(34 197 94);
}
`;

function ensureDiffStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("rich-content-diff-styles")) return;

  const style = document.createElement("style");
  style.id = "rich-content-diff-styles";
  style.textContent = DIFF_STYLES;
  document.head.appendChild(style);
}

export function RichContentDiff(props: RichContentDiffProps) {
  React.useEffect(() => {
    ensureDiffStyles();
  }, []);

  const baseExtensions = React.useMemo(() => createRichEditorExtensions({}, { editable: false }), []);
  const schema = React.useMemo(() => getSchema(baseExtensions), [baseExtensions]);

  const diffResult: DiffRichContentResult = React.useMemo(
    () => diffRichContent(schema, props.before, props.after),
    [schema, props.before, props.after],
  );

  if (!diffResult.ok) {
    return (
      <div
        className={classNames("rounded-lg border border-surface-outline bg-surface-base p-4", props.className)}
        role="alert"
      >
        <p className="font-medium text-content-error">Unable to compare these versions</p>
        <p className="mt-1 text-sm text-content-dimmed">
          One of the snapshots could not be parsed with the current editor schema.
        </p>
      </div>
    );
  }

  let beforeDoc;
  let afterDoc;

  try {
    beforeDoc = schema.nodeFromJSON(props.before as JSONContent);
    afterDoc = schema.nodeFromJSON(props.after as JSONContent);
  } catch {
    return (
      <div className={classNames("rounded-lg border border-surface-outline p-4", props.className)} role="alert">
        <p className="font-medium text-content-error">Unable to compare these versions</p>
      </div>
    );
  }

  const beforeDecorations = buildDiffDecorations(beforeDoc, diffResult.changes, "before");
  const afterDecorations = buildDiffDecorations(afterDoc, diffResult.changes, "after");

  return (
    <div className={classNames("flex flex-col gap-3", props.className)}>
      <div className="flex flex-wrap items-center gap-4 text-sm text-content-dimmed" aria-label="Diff legend">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-200 dark:bg-red-900" aria-hidden />
          Removed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" aria-hidden />
          Added
        </span>
        {diffResult.changes.length === 0 && <span>No content changes</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DiffPane
          label="Removed"
          content={props.before as JSONContent}
          decorationsExtension={createDiffDecorationsExtension(beforeDecorations)}
          mentionedPersonLookup={props.mentionedPersonLookup}
          baseExtensions={baseExtensions}
        />
        <DiffPane
          label="Added"
          content={props.after as JSONContent}
          decorationsExtension={createDiffDecorationsExtension(afterDecorations)}
          mentionedPersonLookup={props.mentionedPersonLookup}
          baseExtensions={baseExtensions}
        />
      </div>
    </div>
  );
}

type DiffPaneProps = {
  label: string;
  content: JSONContent;
  decorationsExtension: ReturnType<typeof createDiffDecorationsExtension>;
  mentionedPersonLookup: MentionedPersonLookupFn;
  baseExtensions: Extensions;
};

function DiffPane(props: DiffPaneProps) {
  const extensions = React.useMemo(
    () => [...props.baseExtensions, props.decorationsExtension],
    [props.baseExtensions, props.decorationsExtension],
  );

  const editor = TipTap.useEditor({
    editable: false,
    content: props.content,
    extensions,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: "diff-pane focus:outline-none text-content-accent",
        "aria-label": `${props.label} version content`,
      },
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(props.content, { emitUpdate: false });
  }, [editor, props.content]);

  const editorState = React.useMemo((): EditorState => {
    return {
      editor,
      submittable: true,
      focused: false,
      empty: false,
      uploading: false,
      linkEditActive: false,
      setLinkEditActive: () => undefined,
      mentionedPersonLookup: props.mentionedPersonLookup,
      uploadFile: undefined,
      setContent: () => undefined,
      setFocused: () => undefined,
      getJson: () => editor?.getJSON() ?? null,
      localDraftRestored: false,
      clearLocalDraft: () => undefined,
    };
  }, [editor, props.mentionedPersonLookup]);

  return (
    <section className="min-w-0 rounded-lg border border-surface-outline bg-surface-base">
      <header className="border-b border-stroke-base px-3 py-2 text-sm font-medium text-content-base">
        {props.label}
      </header>
      <div className="p-3">
        <EditorContext.Provider value={editorState}>
          <div className="ProseMirror">
            <TipTap.EditorContent editor={editor} />
          </div>
        </EditorContext.Provider>
      </div>
    </section>
  );
}
