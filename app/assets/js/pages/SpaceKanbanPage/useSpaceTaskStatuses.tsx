import * as React from "react";

import * as Tasks from "@/models/tasks";
import * as Spaces from "@/models/spaces";

import { SpaceKanbanPage } from "turboui";

interface UseSpaceTaskStatusesOptions {
  spaceId: string;
  tasks: SpaceKanbanPage.Task[];
  setTasks: React.Dispatch<React.SetStateAction<SpaceKanbanPage.Task[]>>;
}

export function useSpaceTaskStatuses({ spaceId, tasks, setTasks }: UseSpaceTaskStatusesOptions) {
  const updateTaskStatuses = Spaces.useUpdateSpaceTaskStatuses();

  const handleStatusesChange = React.useCallback(
    async (payload: {
      nextStatuses: SpaceKanbanPage.StatusOption[];
      deletedStatusReplacements: Record<string, string>;
    }) => {
      const previousTasks = tasks;

      if (Object.keys(payload.deletedStatusReplacements).length > 0) {
        const nextStatusesById = new Map(payload.nextStatuses.map((s) => [s.id, s] as const));

        setTasks((prev) =>
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

      const taskStatuses = Tasks.serializeTaskStatuses(payload.nextStatuses);
      const deletedStatusReplacements = Object.entries(payload.deletedStatusReplacements).map(
        ([deletedStatusId, replacementStatusId]) => ({
          deletedStatusId,
          replacementStatusId,
        }),
      );

      try {
        await updateTaskStatuses.mutateAsync({
          spaceId,
          taskStatuses,
          deletedStatusReplacements,
        });
      } catch (e) {
        setTasks(previousTasks);
        throw e;
      }
    },
    [setTasks, spaceId, tasks, updateTaskStatuses],
  );

  return { handleStatusesChange };
}
