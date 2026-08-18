import React from "react";
import { useSearchParams } from "react-router";

import { TaskSlideIn } from "../../TaskBoard/KanbanView/TaskSlideIn";
import type { TemplateTaskSlideInContext } from "../../TaskBoard/KanbanView/types";
import * as Types from "../../TaskBoard/types";
import { compareIds } from "../../utils/ids";
import type { MilestonePage } from "../types";
import { isTemplateMilestoneState } from "../types";

export function useTaskSlideIn(props: MilestonePage.State) {
  const isTemplate = isTemplateMilestoneState(props);
  const enabled = isTemplate ? Boolean(props.getTemplateTaskPageProps) : Boolean(props.getTaskPageProps);
  const { selectedTaskId, setSelectedTaskId } = useTaskSlideInSelection({ tasks: props.tasks, enabled });
  const taskPageProps = getTaskPageProps(props, selectedTaskId);
  const taskSlideIn = (
    <TaskSlideIn
      isOpen={Boolean(selectedTaskId)}
      onClose={() => setSelectedTaskId(null)}
      taskPageProps={taskPageProps}
    />
  );

  return { selectedTaskId, setSelectedTaskId, taskSlideIn };
}

function useTaskSlideInSelection({ tasks, enabled }: { tasks: { id: string }[]; enabled: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdFromUrl = React.useMemo(() => {
    const value = searchParams.get("taskId");
    return value && value.length > 0 ? value : null;
  }, [searchParams]);
  const [selectedTaskId, setSelectedTaskIdState] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    if (!taskIdFromUrl) {
      setSelectedTaskIdState(null);
      return;
    }

    if (tasks.some((task) => compareIds(task.id, taskIdFromUrl))) {
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
  }, [enabled, setSearchParams, taskIdFromUrl, tasks]);

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

function getTaskPageProps(props: MilestonePage.State, taskId: string | null) {
  if (!taskId) return null;

  if (isTemplateMilestoneState(props)) {
    const context: TemplateTaskSlideInContext = {
      milestoneId: props.milestoneId,
      tasks: props.tasks,
      milestones: props.milestones,
      statuses: props.statuses,
      onTaskCreate: props.onTaskCreate,
      onTaskUpdate: props.onTaskUpdate,
      onTaskDelete: props.onTaskDelete,
      onTaskReorder: props.onTaskReorder,
      personSearch: props.personSearch,
      richTextHandlers: props.richTextHandlers,
    };

    return props.getTemplateTaskPageProps?.(taskId, context) ?? null;
  }

  const context: Types.TaskListSlideInContext = {
    tasks: props.tasks,
    statuses: props.statusOptions,
    onTaskCreate: props.onTaskCreate,
    onTaskAssigneeChange: props.onTaskAssigneeChange,
    onTaskDueDateChange: props.onTaskDueDateChange,
    onTaskRemindersChange: props.onTaskRemindersChange,
    onTaskStatusChange: props.onTaskStatusChange,
    onTaskMilestoneChange: (taskId, nextMilestone) => {
      if (props.onTaskMilestoneChange) {
        props.onTaskMilestoneChange(taskId, nextMilestone);
        return;
      }

      props.onTaskReorder?.(taskId, nextMilestone?.id ?? null, 1000);
    },
    onTaskDescriptionChange: props.onTaskDescriptionChange,
    onTaskNameChange: props.onTaskNameChange,
    onTaskDelete: props.onTaskDelete,
    milestones: props.milestones,
    onMilestoneSearch: props.onMilestoneSearch,
    assigneePersonSearch: props.assigneePersonSearch,
    richTextHandlers: props.richTextHandlers,
  };

  return props.getTaskPageProps?.(taskId, context) ?? null;
}
