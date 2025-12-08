import * as React from "react";

import Api from "@/api";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import { assertPresent } from "@/utils/assertions";

import { showErrorToast, MilestoneKanbanPage } from "turboui";

export function useMilestoneTaskStatuses(
  milestone: Milestones.Milestone,
  baseTasks: MilestoneKanbanPage.Task[],
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
    async (nextStatuses: MilestoneKanbanPage.StatusOption[]) => {
      const previousStatuses = baseStatuses;
      setBaseStatuses(nextStatuses);

      try {
        const backendStatuses = Tasks.serializeTaskStatuses(nextStatuses);
        const res = await Api.projects.updateTaskStatuses({
          projectId: milestone.project!.id,
          taskStatuses: backendStatuses,
        });

        if (res.success === false) {
          setBaseStatuses(previousStatuses);
          showErrorToast("Error", "Failed to update task statuses");
          return;
        }

        if (refresh) {
          await refresh();
        }
      } catch (error) {
        console.error("Failed to update task statuses", error);
        setBaseStatuses(previousStatuses);
        showErrorToast("Error", "Failed to update task statuses");
      }
    },
    [milestone.project.id, refresh, baseStatuses],
  );

  const { tasks, statuses } = React.useMemo(() => {
    const knownStatusValues = new Set(baseStatuses.map((s) => s.value));

    const hasOrphanTasks = baseTasks.some((task) => {
      const statusValue = task.status?.value || task.status?.id;
      // Treat tasks with no status OR with a status that no longer exists
      // in the current statuses list as "unknown".
      return !statusValue || !knownStatusValues.has(statusValue);
    });

    if (!hasOrphanTasks) {
      return { tasks: baseTasks, statuses: baseStatuses };
    }

    const unknownStatus = {
      id: "unknown-status",
      value: "unknown-status",
      label: "Unknown status",
      color: "gray",
      icon: "circleDot",
      index: -1,
    } as (typeof baseStatuses)[number];

    const nextStatuses = baseStatuses.some((s) => s.value === "unknown-status")
      ? baseStatuses
      : [unknownStatus, ...baseStatuses];

    const nextTasks = baseTasks.map((task) => {
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
  }, [baseTasks, baseStatuses]);

  return { tasks, statuses, handleStatusesChange };
}
