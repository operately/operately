import React from "react";

import { TaskSlideIn } from "../../TaskBoard/KanbanView/TaskSlideIn";
import type { TemplateTaskSlideInContext } from "../../TaskBoard/KanbanView/types";
import { useTaskSlideInSelection } from "../../TaskBoard/hooks/useTaskSlideInSelection";
import * as Types from "../../TaskBoard/types";
import type { MilestonePage } from "../types";
import { isTemplateMilestoneState } from "../types";

export function useTaskSlideIn(props: MilestonePage.State) {
  const isTemplate = isTemplateMilestoneState(props);
  const enabled = isTemplate ? Boolean(props.getTemplateTaskPageProps) : Boolean(props.getTaskPageProps);
  const { selectedTaskId, setSelectedTaskId } = useTaskSlideInSelection({ tasks: props.tasks, enabled });
  const closeSlideIn = React.useCallback(() => setSelectedTaskId(null), [setSelectedTaskId]);
  const taskPageProps = getTaskPageProps(props, selectedTaskId);
  const taskSlideIn = (
    <TaskSlideIn isOpen={Boolean(selectedTaskId)} onClose={closeSlideIn} taskPageProps={taskPageProps} />
  );

  return { selectedTaskId, setSelectedTaskId, taskSlideIn };
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
      canEdit: Boolean(props.permissions.canEdit),
      formattedTimePreferences: props.formattedTimePreferences,
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
