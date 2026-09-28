import React from "react";
import type { JSONContent } from "@tiptap/core";
import { setTaskItemChecked, type TaskListInteraction } from "../RichEditor/taskLists";
import { showErrorToast } from "../Toasts";
import { restoreRichTextSource } from "./restoreSource";

export function useTaskListContent(content: JSONContent, taskList: TaskListInteraction) {
  const sourceKey = JSON.stringify(content);
  const [optimistic, setOptimistic] = React.useState<{ source: string; content: JSONContent } | null>(null);
  const [pending, setPending] = React.useState(false);
  const saving = React.useRef(false);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const displayedContent = optimistic && optimistic.source === sourceKey ? optimistic.content : content;

  async function changeTaskItem(itemPath: number[], checked: boolean) {
    if (!taskList.canEdit || saving.current) return;

    saving.current = true;
    setPending(true);
    const expectedContent = restoreRichTextSource(displayedContent) as JSONContent;

    try {
      setOptimistic({ source: sourceKey, content: setTaskItemChecked(displayedContent, itemPath, checked) });
      await taskList.onChange({ itemPath, checked, expectedContent });
    } catch {
      if (mounted.current) setOptimistic(null);
      showErrorToast("Couldn't update task item", "Refresh the content and try again.");
    } finally {
      saving.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return { displayedContent, pending, changeTaskItem };
}
