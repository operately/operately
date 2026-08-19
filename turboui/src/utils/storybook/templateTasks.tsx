import * as React from "react";
import type { TaskPage } from "../../TaskPage";
import type { TemplateProjectPage } from "../../TemplateProjectPage";
import type { GetTemplateTaskPageProps, TemplateTaskSlideInContext } from "../../TaskBoard/KanbanView/types";
import { defaultFormattedTimePreferences } from "../../FormattedTime/types";

function updateTask(
  tasks: TemplateProjectPage.Task[],
  taskId: string,
  updater: (task: TemplateProjectPage.Task) => TemplateProjectPage.Task,
) {
  return tasks.map((task) => (task.id === taskId ? updater(task) : task));
}

function toMilestone(milestone: TemplateProjectPage.Milestone): TaskPage.Milestone {
  return { id: milestone.id, name: milestone.title, dueDate: null, status: "pending" };
}

function getTemplateTaskPageProps(taskId: string, ctx: TemplateTaskSlideInContext): TaskPage.ContentProps | null {
  const task = ctx.tasks.find((item) => item.id === taskId);
  if (!task || !ctx.richTextHandlers) return null;

  const patch = (updates: Partial<TemplateProjectPage.Task>) => void ctx.onTaskUpdate?.(taskId, updates);
  const selectedMilestone = ctx.milestones.find((milestone) => milestone.id === task.milestoneId);

  return {
    variant: "template",
    name: task.name,
    onNameChange: async (name) => {
      patch({ name });
      return true;
    },
    description: task.description,
    onDescriptionChange: async (description) => {
      patch({ description });
      return true;
    },
    status: task.status,
    onStatusChange: (status) => patch({ status }),
    statusOptions: ctx.statuses,
    dueDate: undefined,
    onDueDateChange: () => undefined,
    dueOffsetDays: task.dueOffsetDays,
    onDueOffsetDaysChange: (dueOffsetDays) => patch({ dueOffsetDays }),
    reminders: [],
    onRemindersChange: async () => true,
    milestone: selectedMilestone ? toMilestone(selectedMilestone) : null,
    onMilestoneChange: (next) => patch({ milestoneId: next?.id ?? null }),
    milestones: ctx.milestones.map(toMilestone),
    onMilestoneSearch: async () => undefined,
    assignees: (task.assignees ?? []).flatMap((assignee) =>
      assignee.active && assignee.person
        ? [
            {
              id: assignee.person.id,
              fullName: assignee.person.fullName,
              avatarUrl: assignee.person.avatarUrl,
              profileLink: assignee.person.profileLink ?? "#",
            },
          ]
        : [],
    ),
    onAssigneesChange: (people) =>
      patch({
        assignees: people.map((person) => ({
          id: person.id,
          person: { id: person.id, fullName: person.fullName, avatarUrl: person.avatarUrl },
          role: "contributor",
          responsibility: null,
          accessLevel: 70,
          active: true,
        })),
      }),
    createdAt: new Date(),
    createdBy: null,
    subscriptions: {
      isSubscribed: false,
      hidden: true,
      entityType: "project_task",
      subscribedPeople: [],
      onToggle: () => undefined,
    },
    onDelete: async () => {
      await ctx.onTaskDelete?.(taskId);
    },
    assigneePersonSearch: ctx.personSearch ?? { people: [], onSearch: async () => undefined },
    richTextHandlers: ctx.richTextHandlers,
    canEdit: ctx.canEdit ?? true,
    onAddComment: () => undefined,
    onEditComment: () => undefined,
    onDeleteComment: () => undefined,
    formattedTimePreferences: ctx.formattedTimePreferences ?? defaultFormattedTimePreferences,
  };
}

export function useMockTemplateTaskSlideIn(setTasks: React.Dispatch<React.SetStateAction<TemplateProjectPage.Task[]>>): {
  onTaskCreate: (task: Omit<TemplateProjectPage.Task, "id">) => void;
  onTaskUpdate: (
    taskId: string,
    updates: Partial<TemplateProjectPage.Task>,
  ) => boolean | void | Promise<boolean | void>;
  onTaskDelete: (taskId: string) => void | Promise<void>;
  onTaskReorder: (
    taskId: string,
    milestoneId: string | null,
    destinationIndex: number,
  ) => boolean | void | Promise<boolean | void>;
  getTemplateTaskPageProps: GetTemplateTaskPageProps;
} {
  const onTaskCreate = React.useCallback(
    (task: Omit<TemplateProjectPage.Task, "id">) => {
      const id = `template-task-${Math.random().toString(36).slice(2)}`;
      setTasks((prev) => [...prev, { ...task, id }]);
    },
    [setTasks],
  );

  const onTaskUpdate = React.useCallback(
    (taskId: string, updates: Partial<TemplateProjectPage.Task>) => {
      setTasks((prev) => updateTask(prev, taskId, (task) => ({ ...task, ...updates })));
      return true;
    },
    [setTasks],
  );

  const onTaskDelete = React.useCallback(
    async (taskId: string) => {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    },
    [setTasks],
  );

  const onTaskReorder = React.useCallback(
    (taskId: string, nextMilestoneId: string | null, destinationIndex: number) => {
      setTasks((prev) => {
        const task = prev.find((item) => item.id === taskId);
        if (!task) return prev;

        const remaining = prev.filter((item) => item.id !== taskId);
        const destinationTasks = remaining.filter((item) => item.milestoneId === nextMilestoneId);
        const movedTask = { ...task, milestoneId: nextMilestoneId };
        const boundedIndex = Math.max(0, Math.min(destinationIndex, destinationTasks.length));
        const nextDestination = destinationTasks[boundedIndex];

        if (nextDestination) {
          const insertionIndex = remaining.findIndex((item) => item.id === nextDestination.id);
          remaining.splice(insertionIndex, 0, movedTask);
        } else {
          remaining.push(movedTask);
        }

        return remaining;
      });
      return true;
    },
    [setTasks],
  );

  return {
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    getTemplateTaskPageProps,
  };
}

export function useMockTemplateMilestoneTaskActions(opts: {
  milestoneId: string;
  initialTasks: TemplateProjectPage.Task[];
}) {
  const [tasks, setTasks] = React.useState(opts.initialTasks.filter((task) => task.milestoneId === opts.milestoneId));

  return { tasks, setTasks, ...useMockTemplateTaskSlideIn(setTasks) };
}
