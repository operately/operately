import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { TaskItemChange, TaskListInteraction } from "../RichEditor/taskLists";

export type RichTextJSON = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: RichTextJSON[];
  marks?: RichTextJSON[];
  [key: string]: unknown;
};

export type CommentTaskItemChangeHandler = (commentId: string, change: TaskItemChange) => Promise<void>;

/** Handlers for surfaces that display rich text and may also edit it. */
export interface RichTextHandlers extends RichEditorHandlers {
  taskList: TaskListInteraction;
  /** Null explicitly disables checkbox updates in comments. */
  onCommentTaskItemChange: CommentTaskItemChangeHandler | null;
}
