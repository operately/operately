import * as React from "react";
import * as Tasks from "@/models/tasks";

export interface SizeState {
  size: string;
  options: string[];
  change: (size: string) => void;
}

const OPTIONS = ["small", "medium", "large"];

export function useSizeState(task: Tasks.Task): SizeState {
  const [size, setSize] = React.useState(task.size);

  const [changeSize] = Tasks.useChangeTaskSizeMutation({
    onCompleted: () => setSize(size),
  });

  const change = React.useCallback(
    async (size: string) => {
      await changeSize({
        variables: {
          input: {
            taskId: task.id,
            size,
          },
        },
      });

      setSize(size);
    },
    [task.id, changeSize],
  );

  return {
    size,
    options: OPTIONS,
    change,
  };
}
