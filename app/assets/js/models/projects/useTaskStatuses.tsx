import * as React from "react";
import Api, { type ProjectTaskStatus } from "@/api";
import { showErrorToast } from "turboui";
import type { ProjectPage } from "turboui";
import * as Tasks from "@/models/tasks";

type TaskStatus = ProjectPage.TaskStatus;

export function useTaskStatuses(
  projectId: string,
  backendStatuses: ProjectTaskStatus[] | null | undefined,
  refresh?: () => void,
) {
  const statuses = React.useMemo(
    () =>
      Tasks.parseTaskStatusesForTurboUi(backendStatuses).map((status) => ({
        ...status,
        color: status.color as TaskStatus["color"],
        icon: status.icon as TaskStatus["icon"],
      })),
    [backendStatuses],
  );

  const handleSaveStatuses = React.useCallback(
    async (nextStatuses: TaskStatus[]) => {
      const taskStatuses = Tasks.serializeTaskStatuses(nextStatuses);

      try {
        const res = await Api.projects.updateTaskStatuses({
          projectId,
          taskStatuses,
        });

        if (res.success === false) {
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }

        refresh?.();
      } catch (error) {
        console.error("Failed to update task statuses", error);
        showErrorToast("Error", "Failed to update task statuses");
      }
    },
    [projectId, refresh],
  );

  return {
    statuses,
    handleSaveStatuses,
  };
}
