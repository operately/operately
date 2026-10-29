import React from "react";
import type { JSONContent } from "@tiptap/core";
import type { InlineCommentSelection, InlineCommentsOptions } from "../RichEditor/extensions/InlineComments";
import { attachedRange, type DocumentInlineCommentsProps, type InlineCommentTarget } from "./types";
import { SelectionAction } from "./SelectionAction";
import { ThreadComposer } from "./ThreadComposer";
import { CommentsPanel } from "./CommentsPanel";

export function useInlineComments(props?: DocumentInlineCommentsProps) {
  const [open, setOpen] = React.useState(false);
  const [overlap, setOverlap] = React.useState<string[]>([]);
  const [selection, setSelection] = React.useState<InlineCommentTarget | null>(null);
  const [selectionRange, setSelectionRange] = React.useState<Range | null>(null);
  const [targetRange, setTargetRange] = React.useState<Range | null>(null);
  const [target, setTarget] = React.useState<InlineCommentTarget | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [conflict, setConflict] = React.useState(false);
  const [mobile, setMobile] = React.useState(
    () => typeof matchMedia !== "undefined" && !matchMedia("(min-width: 1280px)").matches,
  );
  const contentRef = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<number>();

  // Switch between floating cards and the mobile panel at the desktop breakpoint.
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const media = matchMedia("(min-width: 1280px)");
    const update = () => setMobile(!media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Clear selections whose coordinates belong to the previous document version.
  React.useEffect(() => {
    setSelection(null);
    setSelectionRange(null);
  }, [props?.documentVersion]);

  // Reset local review state when switching documents or draft namespaces.
  React.useEffect(() => {
    setOpen(false);
    setCreating(false);
    setTarget(null);
    setTargetRange(null);
    setSelection(null);
    setSelectionRange(null);
    setOverlap([]);
  }, [props?.draftKey]);

  // Open the panel for the selected thread, including direct links.
  React.useEffect(() => {
    if (props?.activeThreadId) setOpen(true);
  }, [props?.activeThreadId, props?.draftKey]);

  // Cancel any pending selection measurement when the hook unmounts.
  React.useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const close = () => {
    setOpen(false);
    props?.onSelectThread(null);
    contentRef.current?.focus();
  };

  const onSelectionChange = (next: InlineCommentSelection | null) => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    setSelectionRange(null);

    if (!next) {
      if (contentRef.current?.contains(document.activeElement)) setSelection(null);
      return;
    }

    if (!props?.canComment) return;

    setSelection({ ...next, sourceVersion: props.documentVersion });

    // Wait for the DOM selection to update, then copy its range to position the Add comment button.
    frame.current = requestAnimationFrame(() => {
      const selected = window.getSelection();
      if (!selected?.rangeCount || selected.isCollapsed) return;
      const range = selected.getRangeAt(0);
      if (contentRef.current?.contains(range.commonAncestorContainer)) setSelectionRange(range.cloneRange());
    });
  };

  const start = () => {
    if (!selection || !props?.canComment || selection.sourceVersion !== props.documentVersion) return;
    setTarget(selection);
    setTargetRange(selectionRange);
    setConflict(false);
    setCreating(true);
    setOpen(true);
    setOverlap([]);
    setSelectionRange(null);
    props.onSelectThread(null);
  };

  if (!props)
    return {
      enabled: false,
      hasFloatingComments: false,
      contentRef,
      comments: null,
      floatingAction: null,
      editorOptions: undefined,
    };

  const staleTarget = conflict || target?.sourceVersion !== props.documentVersion;
  const editorOptions: InlineCommentsOptions = {
    ranges: props.threads
      .filter((thread) => !thread.resolvedAt || thread.id === props.activeThreadId)
      .flatMap((thread) => {
        const range = attachedRange(thread, props.documentVersion);
        return range ? [range] : [];
      }),
    activeThreadId: props.activeThreadId,
    onSelectionChange,
    onThreadClick: (ids) => {
      setOpen(true);
      setSelectionRange(null);
      setOverlap(ids.length > 1 ? ids : []);
      props.onSelectThread(ids.length === 1 ? (ids[0] ?? null) : null);
    },
  };

  const visibleThreads = props.threads.filter(
    (thread) => !thread.resolvedAt || thread.id === props.activeThreadId || overlap.includes(thread.id),
  );

  const cancelCreation = () => {
    setCreating(false);
    setTarget(null);
  };

  const createThread = async (content: JSONContent) => {
    if (!target || staleTarget) return false;
    const result = await props.onCreate(target, content);
    if (result === "conflict") setConflict(true);
    if (result !== "ok") return false;
    setCreating(false);
    setTarget(null);
    return true;
  };

  const composer =
    creating && props.canComment
      ? {
          id: "new",
          from: target?.from,
          selectionRange: targetRange,
          content: (
            <ThreadComposer
              props={props}
              target={target}
              staleTarget={staleTarget}
              onCancel={cancelCreation}
              onPost={createThread}
            />
          ),
        }
      : null;
  const hasFloatingComments = !mobile && (visibleThreads.length > 0 || Boolean(composer));

  return {
    enabled: true,
    hasFloatingComments,
    contentRef,
    editorOptions,
    floatingAction:
      selectionRange && props.canComment ? <SelectionAction range={selectionRange} onAdd={start} /> : null,
    comments: (
      <CommentsPanel
        props={props}
        threads={visibleThreads}
        composer={composer}
        mobile={mobile}
        open={open}
        onClose={close}
        contentRef={contentRef}
      />
    ),
  };
}
