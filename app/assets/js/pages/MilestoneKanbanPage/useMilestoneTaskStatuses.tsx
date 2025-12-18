import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import { assertPresent } from "@/utils/assertions";

import { showErrorToast, MilestoneKanbanPage } from "turboui";

export function useMilestoneTaskStatuses(
  milestone: Milestones.Milestone,
  baseTasks: MilestoneKanbanPage.Task[],
  setBaseTasks: React.Dispatch<React.SetStateAction<MilestoneKanbanPage.Task[]>>,
  refresh?: () => void,
) {
  assertPresent(milestone.project, "Milestone must have a project");
  const [baseStatuses, setBaseStatuses] = React.useState(() =>
    Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses),
  );

  React.useEffect(() => {
    setBaseStatuses(Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses));
  }, [milestone.availableStatuses]);

  const handleStatusesChange = React.useCallback(
    async (payload: {
      nextStatuses: MilestoneKanbanPage.StatusOption[];
      deletedStatusReplacements: Record<string, string>;
    }) => {
      const previousStatuses = baseStatuses;
      const previousTasks = baseTasks;

      if (Object.keys(payload.deletedStatusReplacements).length > 0) {
        const nextStatusesById = new Map(payload.nextStatuses.map((s) => [s.id, s] as const));
        const deletedStatusValues = new Map<string, string>();

        for (const [deletedId, replacementId] of Object.entries(payload.deletedStatusReplacements)) {
          const deletedStatus = baseStatuses.find((s) => s.id === deletedId);
          if (deletedStatus) {
            deletedStatusValues.set(deletedStatus.value, replacementId);
          }
        }

        setBaseTasks((prev) =>
          prev.map((t) => {
            const currentStatusValue = t.status?.value;
            if (!currentStatusValue) return t;

            const replacementStatusId = deletedStatusValues.get(currentStatusValue);
            if (!replacementStatusId) return t;

            const replacementStatus = nextStatusesById.get(replacementStatusId);
            if (!replacementStatus) return t;

            return {
              ...t,
              status: {
                ...(t.status ?? {}),
                ...replacementStatus,
                value: replacementStatus.value,
              },
            };
          }),
        );
      }

      // Update statuses after tasks are updated
      setBaseStatuses(payload.nextStatuses);

      try {
        const taskStatuses = Tasks.serializeTaskStatuses(payload.nextStatuses);
        const deletedStatusReplacements = Object.entries(payload.deletedStatusReplacements).map(
          ([deletedStatusId, replacementStatusId]) => ({
            deletedStatusId,
            replacementStatusId,
          }),
        );
        const res = await Api.projects.updateTaskStatuses({
          projectId: milestone.project!.id,
          taskStatuses,
          deletedStatusReplacements,
        });

        if (res.success === false) {
          setBaseStatuses(previousStatuses);
          setBaseTasks(previousTasks);
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }

        if (refresh) {
          await refresh();
        }
      } catch (error) {
        console.error("Failed to update task statuses", error);
        setBaseStatuses(previousStatuses);
        setBaseTasks(previousTasks);
        showErrorToast("Error", "Failed to update task statuses");
      }
    },
    [milestone.project.id, refresh, baseStatuses, baseTasks, setBaseTasks],
  );

  return { tasks: baseTasks, statuses: baseStatuses, handleStatusesChange };
}
