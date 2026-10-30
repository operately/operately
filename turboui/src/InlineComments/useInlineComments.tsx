import React from "react";
import type { JSONContent } from "@tiptap/core";
import type { InlineCommentSelection, InlineCommentsOptions } from "../RichEditor/extensions/InlineComments";
import { attachedRange, type DocumentInlineCommentsProps, type InlineCommentTarget } from "./types";
import { SelectionAction } from "./SelectionAction";
import { ThreadComposer } from "./ThreadComposer";
import { CommentsPanel } from "./CommentsPanel";

export function useInlineComments(props?: DocumentInlineCommentsProps) {
  const [open, setOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [replyThreadId, setReplyThreadId] = React.useState<string | null>(null);
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
  const composerVersion = React.useRef(0);

  const cancelPointerSelection = React.useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    setSelectionRange(null);
  }, []);
  const selectingWithPointer = usePointerSelection(contentRef, {
    enabled: props?.canComment ?? false,
    resetKey: props?.draftKey,
    onCancel: cancelPointerSelection,
  });

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
    composerVersion.current += 1;
    setOpen(false);
    setShowAll(false);
    setReplyThreadId(null);
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
      composerVersion.current += 1;
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const close = () => {
    setOpen(false);
    setShowAll(false);
    setReplyThreadId(null);
    props?.onSelectThread(null);
    if (!showAll) contentRef.current?.focus();
  };

  // Open a reply only for explicit selection, not after creation or following a link.
  const selectThread = (id: string | null) => {
    setReplyThreadId(id);
    props?.onSelectThread(id);
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
    composerVersion.current += 1;
    setTarget(selection);
    setTargetRange(selectionRange);
    setConflict(false);
    setCreating(true);
    setOpen(true);
    setOverlap([]);
    setSelectionRange(null);
    selectThread(null);
  };

  if (!props)
    return {
      enabled: false,
      hasFloatingComments: false,
      contentRef,
      comments: null,
      floatingAction: null,
      editorOptions: undefined,
      openAllComments: undefined,
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
      selectThread(ids.length === 1 ? (ids[0] ?? null) : null);
    },
  };

  const visibleThreads = props.threads.filter(
    (thread) => !thread.resolvedAt || thread.id === props.activeThreadId || overlap.includes(thread.id),
  );

  const cancelCreation = () => {
    composerVersion.current += 1;
    setCreating(false);
    setTarget(null);
  };

  const createThread = async (content: JSONContent) => {
    if (!target || staleTarget) return false;
    const submittedVersion = composerVersion.current;
    const result = await props.onCreate(target, content);
    // A completed request must not change a newer document or passage composer.
    if (submittedVersion !== composerVersion.current) return false;
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
              key={props.draftKey}
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
    openAllComments: () => {
      setShowAll(true);
      setOpen(true);
      setSelectionRange(null);
    },
    floatingAction:
      selectionRange && props.canComment && !selectingWithPointer ? (
        <SelectionAction range={selectionRange} onAdd={start} />
      ) : null,
    comments: (
      <CommentsPanel
        props={props}
        threads={showAll ? props.threads : visibleThreads}
        replyThreadId={replyThreadId}
        onSelectThread={selectThread}
        composer={composer}
        mobile={mobile}
        showAll={showAll}
        open={open}
        onClose={close}
        contentRef={contentRef}
      />
    ),
  };
}

// Keep tracking the selection, but offer its action only after the drag ends.
function usePointerSelection(
  contentRef: React.RefObject<HTMLElement>,
  { enabled, resetKey, onCancel }: { enabled: boolean; resetKey?: string; onCancel: () => void },
) {
  const [selectingWithPointer, setSelectingWithPointer] = React.useState(false);

  React.useEffect(() => {
    setSelectingWithPointer(false);
  }, [resetKey, enabled]);

  React.useEffect(() => {
    if (!enabled) return;

    const beginSelection = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Node)) return;
      if (contentRef.current?.contains(event.target)) setSelectingWithPointer(true);
    };
    const finishSelection = () => setSelectingWithPointer(false);
    const cancelSelection = () => {
      setSelectingWithPointer(false);
      onCancel();
    };

    // Capture release outside the content, including events stopped by other controls.
    window.addEventListener("pointerdown", beginSelection, true);
    window.addEventListener("pointerup", finishSelection, true);
    window.addEventListener("pointercancel", cancelSelection, true);
    window.addEventListener("blur", cancelSelection);
    return () => {
      window.removeEventListener("pointerdown", beginSelection, true);
      window.removeEventListener("pointerup", finishSelection, true);
      window.removeEventListener("pointercancel", cancelSelection, true);
      window.removeEventListener("blur", cancelSelection);
    };
  }, [contentRef, enabled, onCancel]);

  return selectingWithPointer;
}
