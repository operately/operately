import React from "react";
import * as TipTap from "@tiptap/react";
import { getSchema } from "@tiptap/core";
import type { Extensions, JSONContent } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";

import { createRichEditorExtensions } from "../RichEditor/createRichEditorExtensions";
import type { MentionedPersonLookupFn, EditorState } from "../RichEditor/useEditor";
import { EditorContext } from "../RichEditor/EditorContext";
import classNames from "../utils/classnames";

import { buildDiffDecorations } from "./decorations";
import { createDiffDecorationsExtension } from "./diffDecorationsExtension";
import { diffRichContent } from "./diffRichContent";

export type RichContentDiffProps = {
  before: JSONContent | unknown;
  after: JSONContent | unknown;
  mentionedPersonLookup: MentionedPersonLookupFn;
  className?: string;
  beforeLabel?: React.ReactNode;
  afterLabel?: React.ReactNode;
  beforeAriaLabel?: string;
  afterAriaLabel?: string;
  beforeTitle?: string | null;
  afterTitle?: string | null;
  /** Defaults to true. Set false when the parent page already shows DiffLegend. */
  showLegend?: boolean;
};

export { diffRichContent } from "./diffRichContent";
export { createRichContentSchema } from "./schema";
export type { RichContentChange, DiffRichContentResult } from "./types";

const DIFF_STYLES = `
.ProseMirror .diff-removed,
.ProseMirror.diff-pane .diff-removed {
  background-color: var(--color-red-200);
  color: inherit;
}
.ProseMirror .diff-added,
.ProseMirror.diff-pane .diff-added {
  background-color: var(--color-emerald-200);
  color: inherit;
}
.dark .ProseMirror .diff-removed,
.dark .ProseMirror.diff-pane .diff-removed {
  background-color: color-mix(in srgb, var(--color-red-400) 40%, transparent);
}
.dark .ProseMirror .diff-added,
.dark .ProseMirror.diff-pane .diff-added {
  background-color: color-mix(in srgb, var(--color-emerald-400) 40%, transparent);
}

/* Pull block highlights into the list marker gutter (ul/ol use 1.5em padding).
   Equal padding keeps text in place for every block type — no list special cases. */
.ProseMirror .diff-removed-block,
.ProseMirror .diff-added-block {
  border-left-width: 3px;
  border-left-style: solid;
  padding-left: 1.5em;
  margin-left: -1.5em;
}
.ProseMirror .diff-removed-block {
  border-left-color: var(--color-callout-error-content);
}
.ProseMirror .diff-added-block {
  border-left-color: var(--color-callout-success-content);
}

/* Native outside markers sit outside the background box. Native inside markers
   jump to their own line when the list item wraps a block <p> (TipTap). Paint a
   custom marker inside the highlighted padding instead. */
.ProseMirror li.diff-removed-block,
.ProseMirror li.diff-added-block {
  list-style: none;
  position: relative;
}
.ProseMirror ul > li.diff-removed-block::before,
.ProseMirror ul > li.diff-added-block::before {
  content: "•";
  position: absolute;
  left: 0.45em;
  top: 0;
  line-height: 1.5;
}
.ProseMirror ol > li.diff-removed-block::before,
.ProseMirror ol > li.diff-added-block::before {
  content: counter(list-item) ".";
  position: absolute;
  left: 0;
  top: 0;
  width: 1.25em;
  text-align: right;
  line-height: 1.5;
}

/* Blobs are inline node views that render block DOM. Without this, the
   decoration class lands on an inline wrapper and the highlight never covers
   the visible blob content. */
.ProseMirror .react-renderer.node-blob.diff-removed,
.ProseMirror .react-renderer.node-blob.diff-added {
  display: block;
  border-left-width: 3px;
  border-left-style: solid;
  padding-left: 1.5em;
  margin-left: -1.5em;
}
.ProseMirror .react-renderer.node-blob.diff-removed {
  border-left-color: var(--color-callout-error-content);
}
.ProseMirror .react-renderer.node-blob.diff-added {
  border-left-color: var(--color-callout-success-content);
}
`;

function ensureDiffStyles() {
  if (typeof document === "undefined") return;

  let style = document.getElementById("rich-content-diff-styles") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "rich-content-diff-styles";
    document.head.appendChild(style);
  }

  style.textContent = DIFF_STYLES;
}

export function RichContentDiff(props: RichContentDiffProps) {
  React.useEffect(() => {
    ensureDiffStyles();
  }, []);

  const baseExtensions = React.useMemo(() => createRichEditorExtensions({}, { editable: false }), []);
  const schema = React.useMemo(() => getSchema(baseExtensions), [baseExtensions]);
  const comparison = React.useMemo(
    () => prepareComparison(schema, props.before, props.after),
    [schema, props.before, props.after],
  );

  const beforeLabel = props.beforeLabel ?? "Before";
  const afterLabel = props.afterLabel ?? "After";
  const beforeAriaLabel = props.beforeAriaLabel ?? (typeof beforeLabel === "string" ? beforeLabel : "Before");
  const afterAriaLabel = props.afterAriaLabel ?? (typeof afterLabel === "string" ? afterLabel : "After");
  const showTitles = props.beforeTitle !== undefined || props.afterTitle !== undefined;
  const titlesEqual = (props.beforeTitle ?? "") === (props.afterTitle ?? "");

  if (!comparison.ok) {
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

  return (
    <div className={classNames("flex flex-col gap-4", props.className)}>
      {props.showLegend !== false && comparison.changeCount > 0 && <DiffLegend />}
      {comparison.changeCount === 0 && (
        <p className="text-sm text-content-dimmed" data-test-id="no-content-changes">
          No content changes
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2" data-test-id={showTitles ? "title-comparison" : undefined}>
        <DiffPane
          label={beforeLabel}
          ariaLabel={beforeAriaLabel}
          title={showTitles ? props.beforeTitle : undefined}
          titleVariant={showTitles ? (titlesEqual ? "normal" : "removed") : undefined}
          content={comparison.beforeContent}
          decorationsExtension={comparison.beforeDecorationsExtension}
          mentionedPersonLookup={props.mentionedPersonLookup}
          baseExtensions={baseExtensions}
          position="before"
        />
        <DiffPane
          label={afterLabel}
          ariaLabel={afterAriaLabel}
          title={showTitles ? props.afterTitle : undefined}
          titleVariant={showTitles ? (titlesEqual ? "normal" : "added") : undefined}
          content={comparison.afterContent}
          decorationsExtension={comparison.afterDecorationsExtension}
          mentionedPersonLookup={props.mentionedPersonLookup}
          baseExtensions={baseExtensions}
          position="after"
        />
      </div>
    </div>
  );
}

function prepareComparison(schema: Schema, before: unknown, after: unknown) {
  const diffResult = diffRichContent(schema, before, after);
  if (!diffResult.ok) return { ok: false } as const;

  try {
    const beforeContent = before as JSONContent;
    const afterContent = after as JSONContent;
    const beforeDoc = schema.nodeFromJSON(beforeContent);
    const afterDoc = schema.nodeFromJSON(afterContent);
    const beforeDecorations = buildDiffDecorations(beforeDoc, diffResult.changes, "before");
    const afterDecorations = buildDiffDecorations(afterDoc, diffResult.changes, "after");

    return {
      ok: true,
      beforeContent,
      afterContent,
      beforeDecorationsExtension: createDiffDecorationsExtension(beforeDecorations),
      afterDecorationsExtension: createDiffDecorationsExtension(afterDecorations),
      changeCount: diffResult.changes.length,
    } as const;
  } catch {
    return { ok: false } as const;
  }
}

type DiffPaneProps = {
  label: React.ReactNode;
  ariaLabel: string;
  title?: string | null;
  titleVariant?: "normal" | "removed" | "added";
  content: JSONContent;
  decorationsExtension: ReturnType<typeof createDiffDecorationsExtension>;
  mentionedPersonLookup: MentionedPersonLookupFn;
  baseExtensions: Extensions;
  position: "before" | "after";
};

function DiffPane(props: DiffPaneProps) {
  const extensions = React.useMemo(
    () => [...props.baseExtensions, props.decorationsExtension],
    [props.baseExtensions, props.decorationsExtension],
  );

  const editor = TipTap.useEditor(
    {
      editable: false,
      content: props.content,
      extensions,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: "diff-pane focus:outline-none text-content-accent",
          "aria-label": `${props.ariaLabel} content`,
        },
      },
    },
    [props.content, props.decorationsExtension, props.ariaLabel],
  );

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
    <section
      className={classNames(
        "min-w-0",
        props.position === "before" &&
          "border-b border-stroke-base pb-5 sm:pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8",
        props.position === "after" && "pt-5 sm:pt-8 md:pt-0 md:pl-8",
      )}
      aria-label={props.ariaLabel}
    >
      <header className="mb-5">
        <h2 className="text-sm font-medium text-content-dimmed">{props.label}</h2>
      </header>

      {props.titleVariant !== undefined && (
        <div
          className={classNames(
            "mb-6 text-xl font-extrabold leading-tight text-content-accent sm:text-2xl",
            props.titleVariant === "removed" && "rounded-md bg-red-200 px-2 py-1 dark:bg-red-400/40",
            props.titleVariant === "added" && "rounded-md bg-emerald-200 px-2 py-1 dark:bg-emerald-400/40",
          )}
          data-test-id={`title-${props.titleVariant}`}
        >
          {props.title || "Untitled"}
        </div>
      )}

      <div>
        <EditorContext.Provider value={editorState}>
          <div className="ProseMirror">
            <TipTap.EditorContent editor={editor} />
          </div>
        </EditorContext.Provider>
      </div>
    </section>
  );
}

export function DiffLegend(props: { className?: string }) {
  return (
    <div
      className={classNames("flex flex-wrap items-center gap-4 text-sm text-content-dimmed", props.className)}
      aria-label="Diff legend"
    >
      <ChangeBadge kind="removed" label="Removed" />
      <ChangeBadge kind="added" label="Added" />
    </div>
  );
}

function ChangeBadge(props: { kind: "removed" | "added"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-content-dimmed">
      <span
        className={classNames(
          "inline-block h-2.5 w-2.5 rounded-sm border",
          props.kind === "removed" && "border-callout-error-content bg-callout-error-bg",
          props.kind === "added" && "border-callout-success-content bg-callout-success-bg",
        )}
        aria-hidden
      />
      {props.label}
    </span>
  );
}
