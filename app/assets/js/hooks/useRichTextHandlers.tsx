import type { RichTextHandlers } from "turboui";
import type { SearchScope } from "@/models/people";
import { useSetTaskItemChecked, type TaskListResource } from "@/models/richContent/taskListLifecycle";
import { useRichEditorHandlers } from "./useRichEditorHandlers";

interface Props {
  scope?: SearchScope;
  taskList: TaskListResource | null;
  templateComments?: boolean;
}

export function useRichTextHandlers({ scope, taskList, templateComments }: Props): RichTextHandlers {
  const editorHandlers = useRichEditorHandlers({ scope });
  const setTaskItemChecked = useSetTaskItemChecked();

  return {
    ...editorHandlers,
    taskList: taskList
      ? { canEdit: taskList.canEdit, onChange: (change) => setTaskItemChecked(taskList, change) }
      : { canEdit: false },
    onCommentTaskItemChange: (commentId, change) =>
      setTaskItemChecked(
        {
          resourceType: templateComments ? "template_comment" : "comment",
          resourceId: commentId,
          field: "content",
        },
        change,
      ),
  };
}
