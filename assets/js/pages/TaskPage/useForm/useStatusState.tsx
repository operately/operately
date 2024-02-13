import * as React from "react";
import * as Tasks from "@/models/tasks";

export interface StatusState {
  status: string;

  close: () => void;
  reopen: () => void;
}

export function useStatusState(task: Tasks.Task): StatusState {
  const [status, setStatus] = React.useState(task.status);

  const [closeTask] = Tasks.useCloseTaskMutation({
    onCompleted: () => setStatus("closed"),
  });

  return {
    status,
    close: () => closeTask({ variables: { input: { taskId: task.id } } }),
    reopen: () => setStatus("open"),
  };
}
