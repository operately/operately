import type { JSONContent } from "@tiptap/core";

export interface TaskItemChange {
  itemPath: number[];
  checked: boolean;
  expectedContent: JSONContent;
}

export type TaskListInteraction =
  | { canEdit: false; onChange?: never }
  | { canEdit: boolean; onChange: (change: TaskItemChange) => Promise<void> };

export function hasTaskList(content: JSONContent | null | undefined): boolean {
  return content?.type === "taskList" || (content?.content?.some(hasTaskList) ?? false);
}

export function setTaskItemChecked(content: JSONContent, path: number[], checked: boolean): JSONContent {
  // An exhausted path identifies the target node; only task items can be toggled.
  if (path.length === 0) {
    if (content.type !== "taskItem") throw new Error("The selected task item no longer exists");
    return { ...content, attrs: { ...content.attrs, checked } };
  }

  // Each path entry indexes a child in the current node's content array.
  const [index, ...rest] = path;
  if (index === undefined || !Number.isInteger(index) || index < 0 || !content.content?.[index]) {
    throw new Error("The selected task item no longer exists");
  }

  // Copy nodes along the path, preserving siblings and leaving the source unchanged.
  return {
    ...content,
    content: content.content.map((child, i) => (i === index ? setTaskItemChecked(child, rest, checked) : child)),
  };
}
