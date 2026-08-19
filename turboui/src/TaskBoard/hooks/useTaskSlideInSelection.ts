import React from "react";
import { useSearchParams } from "react-router";

import { compareIds } from "../../utils/ids";

export function useTaskSlideInSelection({ tasks, enabled }: { tasks: { id: string }[]; enabled: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdFromUrl = React.useMemo(() => {
    const value = searchParams.get("taskId");
    return value && value.length > 0 ? value : null;
  }, [searchParams]);
  const urlTaskIsPresent = React.useMemo(
    () => Boolean(taskIdFromUrl && tasks.some((task) => compareIds(task.id, taskIdFromUrl))),
    [taskIdFromUrl, tasks],
  );
  const [selectedTaskId, setSelectedTaskIdState] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    if (!taskIdFromUrl) {
      setSelectedTaskIdState(null);
      return;
    }

    if (urlTaskIsPresent) {
      setSelectedTaskIdState(taskIdFromUrl);
      return;
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("taskId");
        return next;
      },
      { replace: true },
    );
    setSelectedTaskIdState(null);
  }, [enabled, setSearchParams, taskIdFromUrl, urlTaskIsPresent]);

  const setSelectedTaskId = React.useCallback(
    (taskId: string | null) => {
      if (!enabled) return;

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (taskId) next.set("taskId", taskId);
          else next.delete("taskId");
          return next;
        },
        { replace: true },
      );
      setSelectedTaskIdState(taskId);
    },
    [enabled, setSearchParams],
  );

  return { selectedTaskId, setSelectedTaskId };
}
