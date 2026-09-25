import type { TaskListInteraction } from "../../RichEditor/taskLists";
import React from "react";

import RichContent, { parseContent } from "../../RichContent";
import { MentionedPersonLookupFn } from "../../RichEditor/useEditor";

export function AboutMe({
  content,
  taskList,
  mentionedPersonLookup,
}: {
  taskList: TaskListInteraction;
  content: string | null | undefined;
  mentionedPersonLookup: MentionedPersonLookupFn;
}) {
  const parsedContent = parseContent(content);

  return (
    <div>
      <div className="text-xs mb-2 uppercase font-bold">About me</div>
      <RichContent
        taskList={taskList}
        content={parsedContent}
        mentionedPersonLookup={mentionedPersonLookup}
        className="text-sm leading-relaxed"
      />
    </div>
  );
}
