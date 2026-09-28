import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { TaskListContext } from "../RichEditor/extensions/TaskItem";
import type { TaskListInteraction } from "../RichEditor/taskLists";
import { useTaskListContent } from "./useTaskListContent";

interface Props {
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
}: Props) {
  const parsed = React.useMemo(() => (parseContent ? JSON.parse(content) : content), [content, parseContent]);
  const { displayedContent, pending, changeTaskItem } = useTaskListContent(parsed, taskList);

  const editor = useEditor({
    content: displayedContent,
    editable: false,
    thumbnailBlobs,
    transformContent,
    handlers: { mentionedPersonLookup },
  });

  return (
    <TaskListContext.Provider value={{ canEdit: taskList.canEdit, pending, onChange: changeTaskItem }}>
      <Content editor={editor} className={className} />
    </TaskListContext.Provider>
  );
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
export * from "./types";
export * from "./restoreSource";
