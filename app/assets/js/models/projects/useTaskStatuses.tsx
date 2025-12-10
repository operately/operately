import * as React from "react";
import Api, { type TaskStatus } from "@/api";
import { showErrorToast } from "turboui";
import type { ProjectPage } from "turboui";
import * as Tasks from "@/models/tasks";

type Status = ProjectPage.TaskStatus;

export function useTaskStatuses(
  projectId: string,
  backendStatuses: TaskStatus[] | null | undefined,
  refresh?: () => void,
) {
  const statuses = React.useMemo(
    () =>
      Tasks.parseTaskStatusesForTurboUi(backendStatuses).map((status) => ({
        ...status,
        color: status.color as Status["color"],
        icon: status.icon as Status["icon"],
      })),
    [backendStatuses],
  );

  const handleSaveStatuses = React.useCallback(
    async (nextStatuses: Status[]) => {
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
