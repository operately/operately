import * as React from "react";
import Api, { type TaskStatus } from "@/api";
import { showErrorToast } from "turboui";
import type { ProjectPage } from "turboui";
import * as Tasks from "@/models/tasks";

type Status = ProjectPage.TaskStatus;

type SaveStatusesPayload = {
  nextStatuses: Status[];
  deletedStatusReplacements: Record<string, string>;
};

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
    async (payload: SaveStatusesPayload) => {
      const taskStatuses = Tasks.serializeTaskStatuses(payload.nextStatuses);
      const deletedStatusReplacements = Object.entries(payload.deletedStatusReplacements).map(
        ([deletedStatusId, replacementStatusId]) => ({
          deletedStatusId,
          replacementStatusId,
        }),
      );

      try {
        const res = await Api.projects.updateTaskStatuses({
          projectId,
          taskStatuses,
          deletedStatusReplacements,
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
