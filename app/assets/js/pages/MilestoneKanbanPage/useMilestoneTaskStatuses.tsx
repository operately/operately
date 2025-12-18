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
      setBaseStatuses(payload.nextStatuses);

      if (Object.keys(payload.deletedStatusReplacements).length > 0) {
        const nextStatusesById = new Map(payload.nextStatuses.map((s) => [s.id, s] as const));

        setBaseTasks((prev) =>
          prev.map((t) => {
            const currentStatusId = t.status?.id;
            if (!currentStatusId) return t;

            const replacementStatusId = payload.deletedStatusReplacements[currentStatusId];
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

  const { tasks, statuses } = React.useMemo(
    () => normalizeTasksAndStatuses(baseTasks, baseStatuses),
    [baseTasks, baseStatuses],
  );

  return { tasks, statuses, handleStatusesChange };
}

// 
// Helpers
// 

function normalizeTasksAndStatuses(
  tasks: MilestoneKanbanPage.Task[],
  statuses: MilestoneKanbanPage.StatusOption[],
) {
  const knownStatusValues = new Set(statuses.map((s) => s.value));

  if (!hasOrphanedTasks(tasks, knownStatusValues)) {
    return { tasks, statuses };
  }

  const unknownStatus: MilestoneKanbanPage.StatusOption = {
    id: "unknown-status",
    value: "unknown-status",
    label: "Unknown status",
    color: "gray",
    icon: "circleDot",
    index: -1,
  };

  const nextStatuses = statuses.some((s) => s.value === "unknown-status")
    ? statuses
    : [unknownStatus, ...statuses];

  const nextTasks = tasks.map((task) => {
    const statusValue = task.status?.value || task.status?.id;
    if (statusValue && knownStatusValues.has(statusValue)) return task;

    return {
      ...task,
      status: {
        ...(task.status || {}),
        ...unknownStatus,
        value: "unknown-status",
      },
    };
  });

  return { tasks: nextTasks, statuses: nextStatuses };
}

function hasOrphanedTasks(tasks: MilestoneKanbanPage.Task[], knownStatusValues: Set<string>): boolean {
  return tasks.some((task) => {
    const statusValue = task.status?.value || task.status?.id;
    return !statusValue || !knownStatusValues.has(statusValue);
  });
}
