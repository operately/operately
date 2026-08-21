import React from "react";
import { useSearchParams } from "react-router";

import { compareIds } from "../../utils/ids";
import type { Milestone, Task, TaskDisplayMode } from "../types";

const TASK_DISPLAY_MODE_PARAM = "taskDisplay";

export function useTaskDisplayMode({
  tasksView,
  canPersistTasksView,
  onTasksViewChange,
}: {
  tasksView: TaskDisplayMode;
  canPersistTasksView: boolean;
  onTasksViewChange?: (mode: TaskDisplayMode) => void | Promise<void>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlOverride, setUrlOverride] = React.useState<TaskDisplayMode | null>(() =>
    parseTaskDisplayMode(searchParams.get(TASK_DISPLAY_MODE_PARAM)),
  );
  const [localMode, setLocalMode] = React.useState<TaskDisplayMode | null>(null);

  React.useEffect(() => {
    setLocalMode(null);
  }, [tasksView]);

  React.useEffect(() => {
    const rawUrlValue = searchParams.get(TASK_DISPLAY_MODE_PARAM);

    if (!rawUrlValue) {
      return;
    }

    const urlMode = parseTaskDisplayMode(rawUrlValue);

    if (urlMode) {
      setUrlOverride(urlMode);
    }

    const next = new URLSearchParams(searchParams);
    next.delete(TASK_DISPLAY_MODE_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const mode = urlOverride ?? localMode ?? tasksView;

  const setMode = React.useCallback(
    (nextMode: TaskDisplayMode) => {
      setUrlOverride(null);
      setLocalMode(nextMode);

      if (canPersistTasksView && onTasksViewChange) {
        void onTasksViewChange(nextMode);
      }
    },
    [canPersistTasksView, onTasksViewChange],
  );

  return [mode, setMode] as const;
}

export function parseTaskDisplayMode(value: unknown): TaskDisplayMode | null {
  if (value === "list" || value === "board") return value;
  return null;
}

export function useMilestoneFilter({
  milestones,
  tasks,
}: {
  milestones: Milestone[];
  tasks: Task[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const milestonesById = React.useMemo(() => {
    const map = new Map<string, Milestone>();
    milestones.forEach((milestone) => map.set(milestone.id, milestone));
    return map;
  }, [milestones]);

  const milestoneIdFromUrl = React.useMemo(() => {
    const value = searchParams.get("milestone");
    return value && value.length > 0 ? value : null;
  }, [searchParams]);

  const [selectedMilestoneId, setSelectedMilestoneId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!milestoneIdFromUrl) {
      setSelectedMilestoneId(null);
      return;
    }

    if (milestonesById.has(milestoneIdFromUrl)) {
      setSelectedMilestoneId(milestoneIdFromUrl);
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("milestone");
    setSearchParams(next, { replace: true });
    setSelectedMilestoneId(null);
  }, [milestoneIdFromUrl, milestonesById, searchParams, setSearchParams]);

  const selectedMilestone = React.useMemo(() => {
    if (!selectedMilestoneId) return null;
    return milestonesById.get(selectedMilestoneId) ?? null;
  }, [milestonesById, selectedMilestoneId]);

  const filteredTasks = React.useMemo(() => {
    if (!selectedMilestoneId) return tasks;
    return tasks.filter((task) => compareIds(task.milestone?.id, selectedMilestoneId));
  }, [selectedMilestoneId, tasks]);

  const onMilestoneFilterChange = React.useCallback(
    (nextMilestoneId: string | null) => {
      const next = new URLSearchParams(searchParams);

      if (nextMilestoneId) {
        next.set("milestone", nextMilestoneId);
      } else {
        next.delete("milestone");
      }

      setSearchParams(next, { replace: true });
      setSelectedMilestoneId(nextMilestoneId);
    },
    [searchParams, setSearchParams],
  );

  return {
    selectedMilestone,
    selectedMilestoneId,
    tasks: filteredTasks,
    onMilestoneFilterChange,
  };
}
