import React from "react";
import type { Editor } from "@tiptap/core";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { TaskListContext } from "../RichEditor/extensions/TaskItem";
import type { InlineCommentsOptions } from "../RichEditor/extensions/InlineComments";
import type { TaskListInteraction } from "../RichEditor/taskLists";
import { useTaskListContent } from "./useTaskListContent";

interface Props {
  inlineComments?: InlineCommentsOptions;
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
  parseContent?: boolean;
  thumbnailBlobs?: boolean;
  transformContent?: (content: any) => any;
  taskList: TaskListInteraction;
}

export default function RichContent({
  content,
  className,
  mentionedPersonLookup,
  parseContent,
  thumbnailBlobs,
  transformContent,
  taskList,
  inlineComments,
}: Props) {
  const parsed = React.useMemo(() => (parseContent ? JSON.parse(content) : content), [content, parseContent]);
  const { displayedContent, pending, changeTaskItem } = useTaskListContent(parsed, taskList);

  const editor = useEditor({
    content: displayedContent,
    inlineComments,
    editable: false,
    thumbnailBlobs,
    transformContent,
    handlers: { mentionedPersonLookup, resolveResourceLinks: null },
  });

  useScrollToActiveComment(editor.editor, inlineComments);

  return (
    <TaskListContext.Provider value={{ canEdit: taskList.canEdit, pending, onChange: changeTaskItem }}>
      <Content editor={editor} className={className} />
    </TaskListContext.Provider>
  );
}

function useScrollToActiveComment(editor: Editor | null, inlineComments?: InlineCommentsOptions) {
  const activeRange = inlineComments?.ranges.find((range) => range.id === inlineComments.activeThreadId);

  React.useEffect(() => {
    if (!editor || !inlineComments?.activeThreadId) return;

    const range = activeRange;
    if (!range || range.from < 0 || range.from >= editor.state.doc.content.size) return;

    const node = editor.view.domAtPos(range.from).node as Node;
    const element = node instanceof HTMLElement ? node : node.parentElement;
    element?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [editor, inlineComments?.activeThreadId, activeRange?.from, activeRange?.to]);
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
export * from "./types";
export * from "./restoreSource";
