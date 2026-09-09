import * as React from "react";
import { type TaskStatus } from "@/api";
import { showErrorToast } from "turboui";
import type { ProjectPage } from "turboui";
import * as Tasks from "@/models/tasks";

import { useUpdateProjectTaskStatuses } from "./projectLifecycle";

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
  const currentProject = React.useRef(projectId);
  currentProject.current = projectId;
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const mutation = useUpdateProjectTaskStatuses();
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
      const isCurrent = () => mounted.current && currentProject.current === projectId;

      const taskStatuses = Tasks.serializeTaskStatuses(payload.nextStatuses);
      const deletedStatusReplacements = Object.entries(payload.deletedStatusReplacements).map(
        ([deletedStatusId, replacementStatusId]) => ({
          deletedStatusId,
          replacementStatusId,
        }),
      );

      try {
        const res = await mutation.mutateAsync({
          projectId,
          taskStatuses,
          deletedStatusReplacements,
        });

        // If the project has changed, don't refresh the task statuses
        if (!isCurrent()) return;

        if (res.success === false) {
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }
      } catch (error) {
        if (!isCurrent()) return;
        console.error("Failed to update task statuses", error);
        showErrorToast("Error", "Failed to update task statuses");
        return;
      }

      try {
        await refresh?.();
      } catch (error) {
        console.error("Failed to refresh task statuses", error);
      }
    },
    [projectId, refresh, mutation.mutateAsync],
  );

  return {
    statuses,
    handleSaveStatuses,
  };
}
