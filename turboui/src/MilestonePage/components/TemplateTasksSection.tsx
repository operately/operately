import React from "react";

import { SecondaryButton } from "../../Button";
import { IconPlus } from "../../icons";
import { calculateMilestoneStats } from "../../TaskBoard/components/MilestoneCard";
import { TemplateTaskList } from "../../TaskBoard/components/TemplateTaskList";
import { InlineTaskCreator } from "../../TaskBoard/components/InlineTaskCreator";
import { useInlineTaskCreator } from "../../TaskBoard/hooks/useInlineTaskCreator";
import * as Types from "../../TaskBoard/types";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import type { MilestonePage } from "../types";
import { TaskSectionEmptyState } from "./TaskSectionEmptyState";
import { TaskSectionLayout } from "./TaskSectionLayout";

const TASKS_CONTAINER_ID = "template-milestone-tasks";

export function TemplateTasksSection({
  tasks,
  statuses,
  milestoneId,
  permissions,
  onTaskCreate,
  onTaskUpdate,
  onTaskReorder,
  personSearch,
  taskSlideIn,
  onTaskOpen,
}: MilestonePage.TemplateState & Props) {
  const canEdit = permissions.canEdit || false;
  const defaultStatus = statuses[0];
  const {
    open: creatorOpen,
    openCreator,
    closeCreator,
    creatorRef,
    hoverBind,
  } = useInlineTaskCreator({ requireHover: false });
  const stats = calculateMilestoneStats(templateTasksAsBoardTasks(tasks));
  const completionPercentage = calculateCompletionPercentage(stats);
  const handleCreateTask = React.useCallback(
    (name: string) => {
      if (!defaultStatus || !onTaskCreate) return;

      onTaskCreate({
        name,
        description: null,
        milestoneId,
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: defaultStatus,
        reminders: [],
        assignees: [],
      });
    },
    [defaultStatus, milestoneId, onTaskCreate],
  );
  const inlineCreator =
    creatorOpen && canEdit && onTaskCreate ? (
      <InlineTaskCreator
        ref={creatorRef}
        onCreate={handleCreateTask}
        onCancel={closeCreator}
        autoFocus
        testId="inline-template-task-creator-milestonepage"
      />
    ) : null;
  const taskRowProps = React.useMemo(
    () =>
      ({
        statuses,
        onTaskUpdate,
        personSearch,
      }) as TemplateProjectPage.Props,
    [onTaskUpdate, personSearch, statuses],
  );

  return (
    <TaskSectionLayout
      sectionTestId="template-tasks-section"
      hoverBind={hoverBind}
      taskSlideIn={taskSlideIn}
      completionPercentage={completionPercentage}
      headerActions={
        canEdit && onTaskCreate ? (
          <SecondaryButton size="xs" icon={IconPlus} onClick={openCreator} testId="template-tasks-section-add-task">
            <span className="sr-only">Add task</span>
          </SecondaryButton>
        ) : null
      }
    >
      {tasks.length === 0 ? (
        <div className="overflow-hidden rounded-b-lg bg-surface-base">
          <TaskSectionEmptyState inlineCreator={inlineCreator} showCreationPrompt={canEdit} />
        </div>
      ) : (
        <TemplateTaskList
          tasks={tasks}
          containerId={TASKS_CONTAINER_ID}
          destinationMilestoneId={milestoneId}
          canEdit={canEdit}
          onTaskReorder={onTaskReorder}
          taskRowProps={taskRowProps}
          onTaskOpen={onTaskOpen}
          inlineCreateRow={inlineCreator}
        />
      )}
    </TaskSectionLayout>
  );
}

function templateTasksAsBoardTasks(tasks: TemplateProjectPage.Task[]): Types.Task[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.name,
    status: task.status,
    link: "#",
    milestone: null,
    description: null,
    dueDate: null,
    type: "project",
  }));
}

function calculateCompletionPercentage(stats: Types.MilestoneStats) {
  const activeTasks = stats.total - stats.canceled;
  if (activeTasks === 0) return 0;
  return (stats.done / activeTasks) * 100;
}

type Props = {
  taskSlideIn: React.ReactNode;
  onTaskOpen: (taskId: string | null) => void;
};
