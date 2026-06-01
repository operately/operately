import { TaskBoard } from "turboui";

type TaskDescriptionDraft = TaskBoard.NewTaskPayload["description"] | null | undefined;

export function serializeTaskDescription(description: TaskDescriptionDraft): string {
  return description ? JSON.stringify(description) : "";
}
