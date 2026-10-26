import { useCallback, type Dispatch, type SetStateAction } from "react";
import i18n from "@/i18n";
import { showErrorToast, type TaskBoard } from "turboui";
import { compareIds } from "@/routes/paths";
import { useUpdateTaskArchive } from "./taskLifecycle";

export function useTaskArchiveChange(setTasks: Dispatch<SetStateAction<TaskBoard.Task[]>>) {
  const { mutateAsync } = useUpdateTaskArchive();

  return useCallback(
    async (taskId: string, archived: boolean) => {
      try {
        const { task } = await mutateAsync({ taskId, archived });
        setTasks((tasks) =>
          tasks.map((current) =>
            compareIds(current.id, taskId)
              ? { ...current, archivedAt: task.archivedAt ? new Date(task.archivedAt) : null }
              : current,
          ),
        );
        return true;
      } catch (error) {
        console.error("Failed to update task archive", error);
        showErrorToast(
          i18n.t("Error"),
          archived ? i18n.t("Failed to archive task.") : i18n.t("Failed to restore task."),
        );
        return false;
      }
    },
    [mutateAsync, setTasks],
  );
}
