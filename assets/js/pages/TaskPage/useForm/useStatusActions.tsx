import * as React from "react";
import * as Tasks from "@/models/tasks";

import { Fields } from "./fields";

export interface StatusActions {
  moveStatusToDone: () => void;
  moveStatusToTodo: () => void;
}

export function useStatusActions(fields: Fields): StatusActions {
  const [update] = Tasks.useUpdateTaskStatusMutation({});

  const changeStatus = React.useCallback(
    (newStatus: string) => {
      update({
        variables: {
          input: {
            taskId: fields.taskID,
            status: newStatus,
            columnIndex: 0,
          },
        },
      });

      fields.setStatus(newStatus);
    },
    [fields.taskID, update],
  );

  return {
    moveStatusToDone: () => changeStatus("done"),
    moveStatusToTodo: () => changeStatus("todo"),
  };
}
