import * as React from "react";

import { DateField, TaskBoard, TaskPage } from "turboui";
import { useOptimisticComments } from "@/models/comments/useOptimisticComments";
import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

import { useTaskTimelineItems } from "./useTaskTimelineItems";
import { prepareTaskTimelineItems } from "./prepareTaskTimelineItems";
import type { Person as ApiPerson, Task as BackendTask } from "@/api";

type TimelinePerson = NonNullable<TaskPage.ContentProps["currentUser"]>;

export function useTaskSlideInProps(opts: {
  backendTasks: BackendTask[];
  paths: Paths;
  currentUser: ApiPerson | null;
  tasks: TaskBoard.Task[];

  commentEntityType: "project_task" | "space_task";

  canEdit: boolean;
  canComment: boolean;
  hideMilestone?: boolean;

  onTaskAssigneeChange: (taskId: string, assignee: TaskBoard.Person | null) => any;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => any;
  onTaskStatusChange: (taskId: string, newStatus: TaskBoard.Status | null) => any;
  onTaskDescriptionChange: (taskId: string, content: any) => Promise<boolean>;
}) {
  const { backendTasks, paths, currentUser, tasks, canEdit, canComment, hideMilestone, commentEntityType } = opts;

  const parsedCurrentUser = currentUser ? (People.parsePersonForTurboUi(paths, currentUser) ?? undefined) : undefined;

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const lastSeenTaskIdRef = React.useRef<string | null>(null);

  const { activities, comments: fetchedComments, isLoading: isTimelineLoading } = useTaskTimelineItems(
    activeTaskId,
    commentEntityType,
  );

  const { comments, addComment, editComment, deleteComment, addReaction, removeReaction } = useOptimisticComments({
    taskId: activeTaskId,
    parentType: commentEntityType,
    initialComments: fetchedComments,
  });

  const [appendedByTaskId, setAppendedByTaskId] = React.useState<Record<string, TaskPage.TimelineItemType[]>>({});

  React.useEffect(() => {
    if (!activeTaskId) return;

    setAppendedByTaskId((prev) => {
      if (prev[activeTaskId]) return prev;
      return { ...prev, [activeTaskId]: [] };
    });
  }, [activeTaskId]);

  const appendTimelineItem = React.useCallback((taskId: string, item: TaskPage.TimelineItemType) => {
    setAppendedByTaskId((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), item],
    }));
  }, []);

  const findTask = React.useCallback((taskId: string) => tasks.find((t) => t.id === taskId) ?? null, [tasks]);

  const wrapAssigneeChange = React.useCallback(
    async (taskId: string, assignee: TaskBoard.Person | null) => {
      const prevTask = findTask(taskId);
      const prevAssignee = prevTask?.assignees?.[0] ? toTimelinePerson(paths, prevTask.assignees[0]) : null;

      const res = await Promise.resolve(opts.onTaskAssigneeChange(taskId, assignee));

      if (!isSuccessResult(res)) return res;

      if (activeTaskId !== taskId) return res;
      if (!parsedCurrentUser) return res;

      const activityAssignee = assignee ? toTimelinePerson(paths, assignee) : prevAssignee;
      if (!activityAssignee) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_assignee_updating-${Date.now()}`,
          type: "task_assignee_updating",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          assignee: activityAssignee,
          action: assignee ? "assigned" : "unassigned",
          taskName: prevTask?.title ?? "a task",
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, paths],
  );

  const wrapDueDateChange = React.useCallback(
    async (taskId: string, dueDate: DateField.ContextualDate | null) => {
      const prevTask = findTask(taskId);
      const fromDueDate = prevTask?.dueDate ?? null;

      const res = await Promise.resolve(opts.onTaskDueDateChange(taskId, dueDate));

      if (!isSuccessResult(res)) return res;

      if (activeTaskId !== taskId) return res;
      if (!parsedCurrentUser) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_due_date_updating-${Date.now()}`,
          type: "task_due_date_updating",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          fromDueDate,
          toDueDate: dueDate,
          taskName: prevTask?.title ?? "",
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser],
  );

  const wrapStatusChange = React.useCallback(
    async (taskId: string, newStatus: TaskBoard.Status | null) => {
      const prevTask = findTask(taskId);
      const fromStatus = prevTask?.status ?? null;

      const res = await Promise.resolve(opts.onTaskStatusChange(taskId, newStatus));

      if (!isSuccessResult(res)) return res;

      if (activeTaskId !== taskId) return res;
      if (!parsedCurrentUser) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_status_updating-${Date.now()}`,
          type: "task_status_updating",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          fromStatus,
          toStatus: newStatus,
          taskName: prevTask?.title ?? "",
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser],
  );

  const wrapDescriptionChange = React.useCallback(
    async (taskId: string, content: any) => {
      const prevTask = findTask(taskId);

      const res = await opts.onTaskDescriptionChange(taskId, content);

      if (!res) return res;
      if (activeTaskId !== taskId) return res;
      if (!parsedCurrentUser) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_description_change-${Date.now()}`,
          type: "task_description_change",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          hasContent: !!content,
          taskName: prevTask?.title ?? "a task",
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser],
  );

  const getTaskPageProps = React.useCallback(
    (taskId: string, ctx: any): TaskPage.ContentProps | null => {
      const task = ctx.tasks.find((t) => t.id === taskId);
      if (!task) return null;

      if (lastSeenTaskIdRef.current !== taskId) {
        const prevTaskId = lastSeenTaskIdRef.current;
        lastSeenTaskIdRef.current = taskId;
        setTimeout(() => {
          if (prevTaskId) {
            setAppendedByTaskId((prev) => {
              const existing = prev[prevTaskId] ?? [];
              if (existing.length === 0) return prev;
              return { ...prev, [prevTaskId]: [] };
            });
          }

          setActiveTaskId(taskId);
        }, 0);
      }

      const backendTask = backendTasks.find((t) => t.id === taskId) ?? null;

      const description = (() => {
        if (!task.description) return null;
        try {
          return JSON.parse(task.description);
        } catch {
          return null;
        }
      })();

      const assignee = (() => {
        const first = task.assignees?.[0];
        if (!first) return null;

        return People.parsePersonForTurboUi(paths, first);
      })();

      const createdBy = backendTask?.creator ? People.parsePersonForTurboUi(paths, backendTask.creator) : null;

      const appended = activeTaskId === taskId ? (appendedByTaskId[taskId] ?? []) : [];
      const fetchedTimelineItems = activeTaskId === taskId ? prepareTaskTimelineItems(paths, activities, comments) : [];
      const currentTimelineItems =
        activeTaskId === taskId ? sortTimelineItems([...fetchedTimelineItems, ...appended]) : [];
      const currentTimelineIsLoading = activeTaskId === taskId ? isTimelineLoading : true;

      const milestoneProps = buildMilestoneProps({ hideMilestone, taskId, ctx, taskMilestone: task.milestone });

      return {
        ...milestoneProps,

        name: task.title,
        onNameChange: (newName) => {
          const res = ctx.onTaskNameChange?.(taskId, newName);
          return Promise.resolve(res ?? true);
        },

        description,
        onDescriptionChange: (newDescription) =>
          ctx.onTaskDescriptionChange?.(taskId, newDescription) ?? Promise.resolve(false),

        status: task.status,
        onStatusChange: (newStatus) => ctx.onTaskStatusChange?.(taskId, newStatus),

        statusOptions: ctx.statuses,
        dueDate: task.dueDate || undefined,
        onDueDateChange: (newDate) => ctx.onTaskDueDateChange?.(taskId, newDate),

        assignee,
        onAssigneeChange: (newAssignee) => ctx.onTaskAssigneeChange?.(taskId, newAssignee),

        createdAt: new Date(backendTask?.insertedAt ?? Date.now()),
        createdBy,
        subscriptions: { isSubscribed: false, onToggle: () => {}, hidden: true, entityType: "project_task" },

        onDelete: async () => {
          await ctx.onTaskDelete?.(taskId);
        },

        assigneePersonSearch: ctx.assigneePersonSearch,
        richTextHandlers: ctx.richTextHandlers,

        canEdit,

        currentUser: parsedCurrentUser,
        timelineItems: currentTimelineItems,
        timelineIsLoading: currentTimelineIsLoading,
        canComment: canComment,

        onAddComment: (content) => {
          if (activeTaskId !== taskId) return;
          addComment(content);
        },
        onEditComment: (commentId, content) => {
          if (activeTaskId !== taskId) return;
          editComment(commentId, content);
        },
        onDeleteComment: (commentId) => {
          if (activeTaskId !== taskId) return;
          deleteComment(commentId);
        },
        onAddReaction: (commentId, emoji) => {
          if (activeTaskId !== taskId) return;
          addReaction(commentId, emoji);
        },
        onRemoveReaction: (commentId, reactionId) => {
          if (activeTaskId !== taskId) return;
          removeReaction(commentId, reactionId);
        },
      };
    },
    [
      activeTaskId,
      appendedByTaskId,
      backendTasks,
      canComment,
      canEdit,
      addComment,
      addReaction,
      deleteComment,
      editComment,
      hideMilestone,
      isTimelineLoading,
      removeReaction,
      parsedCurrentUser,
      paths,
      activities,
      comments,
    ],
  );

  return React.useMemo(
    () => ({
      getTaskPageProps,
      onTaskAssigneeChange: wrapAssigneeChange,
      onTaskDueDateChange: wrapDueDateChange,
      onTaskStatusChange: wrapStatusChange,
      onTaskDescriptionChange: wrapDescriptionChange,
    }),
    [getTaskPageProps, wrapAssigneeChange, wrapDescriptionChange, wrapDueDateChange, wrapStatusChange],
  );
}

function toTimelinePerson(paths: Paths, person: TaskBoard.Person): TimelinePerson {
  return {
    id: person.id,
    fullName: person.fullName,
    avatarUrl: person.avatarUrl ?? null,
    profileLink: paths.profilePath(person.id),
  };
}

function isSuccessResult(res: unknown): res is { success: true } {
  return typeof res === "object" && res !== null && "success" in res && (res as { success: unknown }).success === true;
}

function sortTimelineItems(items: TaskPage.TimelineItemType[]) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    const aId = a.type === "acknowledgment" ? a.value.id : a.value.id;
    const bId = b.type === "acknowledgment" ? b.value.id : b.value.id;

    const aIsTemp = aId.startsWith("temp-");
    const bIsTemp = bId.startsWith("temp-");

    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;

    const aInsertedAt = a.type === "acknowledgment" ? a.insertedAt : a.value.insertedAt;
    const bInsertedAt = b.type === "acknowledgment" ? b.insertedAt : b.value.insertedAt;

    return aInsertedAt.localeCompare(bInsertedAt);
  });

  return sorted;
}

type MilestoneProps = Pick<
  TaskPage.ContentProps,
  "milestone" | "onMilestoneChange" | "milestones" | "onMilestoneSearch" | "hideMilestone"
>;

function buildMilestoneProps(opts: {
  hideMilestone?: boolean;
  taskId: string;
  ctx: any;
  taskMilestone: TaskBoard.Milestone | null;
}): MilestoneProps {
  if (opts.hideMilestone) {
    return {
      milestone: null,
      onMilestoneChange: () => {},
      milestones: [],
      onMilestoneSearch: async () => {},
      hideMilestone: true,
    };
  }

  return {
    milestone: opts.taskMilestone ? toTaskPageMilestone(opts.taskMilestone) : null,
    onMilestoneChange: (m) => opts.ctx.onTaskMilestoneChange?.(opts.taskId, m),
    milestones: (opts.ctx.milestones ?? []).map((m: any) => ({ ...m, dueDate: m.dueDate ?? null })),
    onMilestoneSearch: opts.ctx.onMilestoneSearch,
    hideMilestone: false,
  };
}

function toTaskPageMilestone(milestone: TaskBoard.Milestone): TaskPage.Milestone {
  return {
    id: milestone.id,
    name: milestone.name,
    dueDate: milestone.dueDate ?? null,
    status: milestone.status,
    link: milestone.link,
  };
}
