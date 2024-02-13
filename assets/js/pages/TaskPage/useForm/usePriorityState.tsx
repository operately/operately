import * as React from "react";
import * as Tasks from "@/models/tasks";

export interface PriorityState {
  priority: string;
  options: string[];
  change: (priority: string) => Promise<void>;
}

const OPTIONS = ["low", "medium", "high", "urgent"];

export function usePriorityState(task: Tasks.Task): PriorityState {
  const [priority, setPriority] = React.useState(task.priority);

  const [changePriority] = Tasks.useChangeTaskPriorityMutation({
    onCompleted: () => setPriority(priority),
  });

  const change = React.useCallback(
    async (priority: string) => {
      await changePriority({
        variables: {
          input: {
            taskId: task.id,
            priority,
          },
        },
      });

      setPriority(priority);
    },
    [task.id, changePriority],
  );

  return {
    priority,
    options: OPTIONS,
    change,
  };
}
