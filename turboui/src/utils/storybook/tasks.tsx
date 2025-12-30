import * as React from "react";

import { SidebarNotificationSection } from "../../SidebarSection";
import type { DateField } from "../../DateField";
import type { TaskPage } from "../../TaskPage";
import type * as TaskBoard from "../../TaskBoard/types";
import type { KanbanBoardProps, KanbanState, KanbanStatus, TaskSlideInContext } from "../../TaskBoard/KanbanView/types";

function toKanbanStatus(task: TaskBoard.Task, statuses: TaskBoard.Status[]): KanbanStatus {
  const value = task.status?.value || task.status?.id;
  const match = statuses.find((status) => status.value === value);
  return (match?.value ?? statuses[0]?.value ?? "unassigned") as KanbanStatus;
}

function buildKanbanStateFromTasks(tasks: TaskBoard.Task[], statuses: TaskBoard.Status[]): KanbanState {
  const state = statuses.reduce<KanbanState>((acc, status) => {
    acc[status.value] = [];
    return acc;
  }, {} as KanbanState);

  tasks.forEach((task) => {
    const status = toKanbanStatus(task, statuses);
    state[status]?.push(task.id);
  });

  return state;
}

function updateTask(tasks: TaskBoard.Task[], taskId: string, updater: (task: TaskBoard.Task) => TaskBoard.Task): TaskBoard.Task[] {
  return tasks.map((t) => (t.id === taskId ? updater(t) : t));
}

function toTaskPageMilestone(milestone: TaskBoard.Milestone): TaskPage.Milestone {
  return {
    id: milestone.id,
    name: milestone.name,
    dueDate: milestone.dueDate ?? null,
    status: milestone.status,
    link: milestone.link ?? "#",
  };
}

function toTaskPagePerson(person: TaskBoard.Person): TaskPage.Person {
  return {
    id: person.id,
    fullName: person.fullName,
    avatarUrl: person.avatarUrl,
    profileLink: "#",
  };
}

export function useMockTaskBoardActions(opts: {
  tasks: TaskBoard.Task[];
  setTasks: React.Dispatch<React.SetStateAction<TaskBoard.Task[]>>;
  statuses: TaskBoard.Status[];
  subscriptions: SidebarNotificationSection.Props;
  currentUser?: TaskPage.ContentProps["currentUser"];
}): {
  kanbanState: KanbanState;
  onTaskKanbanChange: NonNullable<KanbanBoardProps["onTaskKanbanChange"]>;
  onTaskCreate: (task: TaskBoard.NewTaskPayload) => void;
  onTaskNameChange: (taskId: string, name: string) => void;
  onTaskAssigneeChange: (taskId: string, assignee: TaskBoard.Person | null) => void;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
  onTaskStatusChange: (taskId: string, status: TaskBoard.Status | null) => void;
  onTaskDelete: (taskId: string) => Promise<{ success: boolean }>;
  onTaskDescriptionChange: (taskId: string, description: any) => Promise<boolean>;
  getTaskPageProps: KanbanBoardProps["getTaskPageProps"];
} {
  const { tasks, setTasks, statuses, subscriptions, currentUser } = opts;

  const kanbanState = React.useMemo(() => buildKanbanStateFromTasks(tasks, statuses), [tasks, statuses]);

  const onTaskCreate = React.useCallback(
    (payload: TaskBoard.NewTaskPayload) => {
      const id = `mock-task-${Math.random().toString(36).slice(2)}`;

      setTasks((prev) => [
        {
          id,
          title: payload.title,
          status: statuses[0] ?? null,
          dueDate: payload.dueDate,
          description: null,
          assignees: [],
          link: "#",
          milestone: payload.milestone,
          type: "project",
          _isHelperTask: false,
        },
        ...prev,
      ]);
    },
    [setTasks, statuses],
  );

  const onTaskNameChange = React.useCallback(
    (taskId: string, name: string) => {
      setTasks((prev) => updateTask(prev, taskId, (t) => ({ ...t, title: name })));
    },
    [setTasks],
  );

  const onTaskAssigneeChange = React.useCallback(
    (taskId: string, assignee: TaskBoard.Person | null) => {
      setTasks((prev) =>
        updateTask(prev, taskId, (t) => ({
          ...t,
          assignees: assignee ? [assignee] : [],
        })),
      );
    },
    [setTasks],
  );

  const onTaskDueDateChange = React.useCallback(
    (taskId: string, dueDate: DateField.ContextualDate | null) => {
      setTasks((prev) => updateTask(prev, taskId, (t) => ({ ...t, dueDate })));
    },
    [setTasks],
  );

  const onTaskStatusChange = React.useCallback(
    (taskId: string, status: TaskBoard.Status | null) => {
      setTasks((prev) => updateTask(prev, taskId, (t) => ({ ...t, status })));
    },
    [setTasks],
  );

  const onTaskKanbanChange = React.useCallback<NonNullable<KanbanBoardProps["onTaskKanbanChange"]>>(
    async (event) => {
      const statusOption =
        statuses.find((s) => s.value === event.to.status) ||
        ({
          id: event.to.status,
          value: event.to.status,
          label: event.to.status,
          color: "gray",
          icon: "circleDot",
          index: statuses.length,
        } as TaskBoard.Status);

      setTasks((prev) => updateTask(prev, event.taskId, (t) => ({ ...t, status: statusOption })));
    },
    [setTasks, statuses],
  );

  const onTaskDelete = React.useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return { success: true };
  }, [setTasks]);

  const onTaskDescriptionChange = React.useCallback(
    async (taskId: string, description: any) => {
      setTasks((prev) => updateTask(prev, taskId, (t) => ({ ...t, description })));
      return true;
    },
    [setTasks],
  );

  const getTaskPageProps = React.useCallback(
    (taskId: string, ctx: TaskSlideInContext): TaskPage.ContentProps | null => {
      const task = ctx.tasks.find((t) => t.id === taskId);
      if (!task) return null;

      if (!ctx.assigneePersonSearch) return null;
      if (!ctx.richTextHandlers) return null;

      return {
        milestone: task.milestone ? toTaskPageMilestone(task.milestone) : null,
        onMilestoneChange: (next) => {
          const resolved = next ? (ctx.milestones ?? []).find((m) => m.id === next.id) ?? null : null;
          ctx.onTaskMilestoneChange?.(taskId, resolved);
        },
        milestones: (ctx.milestones ?? []).map(toTaskPageMilestone),
        onMilestoneSearch: ctx.onMilestoneSearch ?? (async () => {}),
        hideMilestone: false,

        name: task.title,
        onNameChange: async (newName) => {
          ctx.onTaskNameChange?.(taskId, newName);
          return true;
        },

        description: task.description,
        onDescriptionChange: async (newDescription) => {
          if (!ctx.onTaskDescriptionChange) return false;
          return ctx.onTaskDescriptionChange(taskId, newDescription);
        },

        status: task.status,
        onStatusChange: (newStatus) => ctx.onTaskStatusChange?.(taskId, newStatus),
        statusOptions: ctx.statuses as TaskBoard.Status[],

        dueDate: task.dueDate ?? undefined,
        onDueDateChange: (newDueDate) => ctx.onTaskDueDateChange?.(taskId, newDueDate),

        assignee: task.assignees?.[0] ? toTaskPagePerson(task.assignees[0]) : null,
        onAssigneeChange: (newAssignee) => ctx.onTaskAssigneeChange?.(taskId, newAssignee),

        createdAt: new Date(),
        createdBy: null,

        subscriptions,

        onDelete: async () => {
          await ctx.onTaskDelete?.(taskId);
        },
        onArchive: undefined,

        assigneePersonSearch: ctx.assigneePersonSearch,
        richTextHandlers: ctx.richTextHandlers,

        canEdit: true,

        timelineItems: [],
        timelineIsLoading: false,
        currentUser,
        canComment: false,
        onAddComment: () => {},
        onEditComment: () => {},
        onDeleteComment: () => {},
        onAddReaction: undefined,
        onRemoveReaction: undefined,
        timelineFilters: undefined,
      };
    },
    [currentUser, subscriptions],
  );

  return {
    kanbanState,
    onTaskKanbanChange,
    onTaskCreate,
    onTaskNameChange,
    onTaskAssigneeChange,
    onTaskDueDateChange,
    onTaskStatusChange,
    onTaskDelete,
    onTaskDescriptionChange,
    getTaskPageProps,
  };
}
