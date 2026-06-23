import * as React from "react";

import { DateField, TaskBoard, TaskPage, showErrorToast } from "turboui";
import { useOptimisticComments } from "@/models/comments/useOptimisticComments";
import * as People from "@/models/people";
import { compareIds, Paths } from "@/routes/paths";

import { useTaskTimelineItems } from "./useTaskTimelineItems";
import { prepareTaskTimelineItems } from "./prepareTaskTimelineItems";
import Api, { type Person as ApiPerson, type Task as BackendTask } from "@/api";
import { useSubscription } from "@/models/subscriptions";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

type TimelinePerson = NonNullable<TaskPage.ContentProps["currentUser"]>;

export function useTaskSlideInProps(opts: {
  backendTasks: BackendTask[];
  paths: Paths;
  currentUser: ApiPerson | null;
  tasks: TaskBoard.Task[];

  commentEntityType: "project_task" | "space_task";
  cacheKey: string;
  onRefresh?: () => Promise<void>;

  canEdit: boolean;
  canComment: boolean;
  hideMilestone?: boolean;

  onTaskNameChange: (taskId: string, newName: string) => Promise<boolean> | boolean;
  onTaskAssigneeChange: (taskId: string, assignees: TaskBoard.Person[]) => Promise<boolean> | boolean;
  onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => Promise<boolean> | boolean;
  onTaskRemindersChange: (taskId: string, reminders: TaskPage.Reminder[]) => Promise<boolean> | boolean;
  onTaskStatusChange: (taskId: string, newStatus: TaskBoard.Status | null) => Promise<boolean> | boolean;
  onTaskDescriptionChange: (taskId: string, content: any) => Promise<boolean>;
  onMoveTaskSuccess: (result: { movedTaskId: string; destinationType: string; destinationId: string }) => Promise<void>;
  projectSearch: TaskPage.ContentProps["projectSearch"];
  spaceSearch: TaskPage.ContentProps["spaceSearch"];
}) {
  const { backendTasks, paths, currentUser, tasks, canEdit, canComment, hideMilestone, commentEntityType } = opts;
  const formattedTimePreferences = useFormattedTimePreferences();

  const parsedCurrentUser = currentUser ? (People.parsePersonForTurboUi(paths, currentUser) ?? undefined) : undefined;

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const [timelineRefreshVersion, setTimelineRefreshVersion] = React.useState(0);
  const lastSeenTaskIdRef = React.useRef<string | null>(null);
  const activeBackendTask = React.useMemo(
    () => backendTasks.find((task) => activeTaskId && compareIds(task.id, activeTaskId)) ?? null,
    [activeTaskId, backendTasks],
  );

  const subscriptions = useSubscription({
    subscriptionList: activeBackendTask?.subscriptionList,
    entityId: activeBackendTask?.id ?? "",
    entityType: commentEntityType,
    cacheKey: opts.cacheKey,
    onRefresh: opts.onRefresh,
  });

  const {
    activities,
    comments: fetchedComments,
    isLoading: isTimelineLoading,
  } = useTaskTimelineItems(activeTaskId, commentEntityType, timelineRefreshVersion);

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

  const findTask = React.useCallback((taskId: string) => tasks.find((t) => compareIds(t.id, taskId)) ?? null, [tasks]);

  const refreshTimelineAfterInactiveChange = React.useCallback(() => {
    setTimelineRefreshVersion((version) => version + 1);
  }, []);

  const wrapNameChange = React.useCallback(
    async (taskId: string, newName: string) => {
      const prevTask = findTask(taskId);
      const prevName = prevTask?.title ?? "";

      const res = await Promise.resolve(opts.onTaskNameChange(taskId, newName));

      if (!res) return false;

      if (activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
        return res;
      }
      if (!parsedCurrentUser) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_name_updating-${Date.now()}`,
          type: "task_name_updating",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          fromTitle: prevName,
          toTitle: newName,
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, refreshTimelineAfterInactiveChange],
  );

  const wrapAssigneeChange = React.useCallback(
    async (taskId: string, assignees: TaskBoard.Person[]) => {
      const prevTask = findTask(taskId);
      const prevAssignees = prevTask?.assignees || [];
      const newAssigneeIds = new Set(assignees.map((assignee) => assignee.id));
      const prevAssigneeIds = new Set(prevAssignees.map((assignee) => assignee.id));

      const res = await Promise.resolve(opts.onTaskAssigneeChange(taskId, assignees));

      if (!res) return false;

      if (activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
        return res;
      }
      if (!parsedCurrentUser) return res;

      const addedAssignee = assignees.find((assignee) => !prevAssigneeIds.has(assignee.id));
      const removedAssignee = prevAssignees.find((assignee) => !newAssigneeIds.has(assignee.id));
      const activityAssignee = addedAssignee
        ? toTimelinePerson(paths, addedAssignee)
        : removedAssignee
          ? toTimelinePerson(paths, removedAssignee)
          : null;
      if (!activityAssignee) return res;

      appendTimelineItem(taskId, {
        type: "task-activity",
        value: {
          id: `temp-task_assignee_updating-${Date.now()}`,
          type: "task_assignee_updating",
          author: parsedCurrentUser,
          insertedAt: new Date().toISOString(),
          assignee: activityAssignee,
          action: addedAssignee ? "assigned" : "unassigned",
          taskName: prevTask?.title ?? "a task",
          page: "task",
        },
      });

      return res;
    },
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, paths, refreshTimelineAfterInactiveChange],
  );

  const wrapDueDateChange = React.useCallback(
    async (taskId: string, dueDate: DateField.ContextualDate | null) => {
      const prevTask = findTask(taskId);
      const fromDueDate = prevTask?.dueDate ?? null;

      const res = await Promise.resolve(opts.onTaskDueDateChange(taskId, dueDate));

      if (!res) return false;

      if (activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
        return res;
      }
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
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, refreshTimelineAfterInactiveChange],
  );

  const wrapRemindersChange = React.useCallback(
    async (taskId: string, reminders: TaskPage.Reminder[]) => {
      const res = await Promise.resolve(opts.onTaskRemindersChange(taskId, reminders));

      if (res && activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
      }

      return res;
    },
    [activeTaskId, opts, refreshTimelineAfterInactiveChange],
  );

  const wrapStatusChange = React.useCallback(
    async (taskId: string, newStatus: TaskBoard.Status | null) => {
      const prevTask = findTask(taskId);
      const fromStatus = prevTask?.status ?? null;

      const res = await Promise.resolve(opts.onTaskStatusChange(taskId, newStatus));

      if (!res) return false;

      if (activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
        return res;
      }
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
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, refreshTimelineAfterInactiveChange],
  );

  const wrapDescriptionChange = React.useCallback(
    async (taskId: string, content: any) => {
      const prevTask = findTask(taskId);

      const res = await opts.onTaskDescriptionChange(taskId, content);

      if (!res) return res;
      if (activeTaskId !== taskId) {
        refreshTimelineAfterInactiveChange();
        return res;
      }
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
    [activeTaskId, appendTimelineItem, findTask, opts, parsedCurrentUser, refreshTimelineAfterInactiveChange],
  );

  const getTaskPageProps = React.useCallback(
    (taskId: string, ctx: any): TaskPage.ContentProps | null => {
      const task = ctx.tasks.find((t) => compareIds(t.id, taskId));
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

      const assignees = (task.assignees || [])
        .map((assignee) => People.parsePersonForTurboUi(paths, assignee))
        .filter((assignee): assignee is TaskPage.Person => Boolean(assignee));

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
        reminders: task.reminders ?? [],
        onRemindersChange: (reminders) => ctx.onTaskRemindersChange?.(taskId, reminders) ?? Promise.resolve(false),

        assignees,
        onAssigneesChange: (newAssignees) => ctx.onTaskAssigneeChange?.(taskId, newAssignees),

        createdAt: new Date(backendTask?.insertedAt ?? Date.now()),
        createdBy,
        subscriptions,

        onDelete: async () => {
          await ctx.onTaskDelete?.(taskId);
        },
        onMoveTask: async ({ destinationType, destinationId }) => {
          try {
            const res = await Api.tasks.move({ taskId, destinationType, destinationId });
            const movedTaskId = res.task?.id ?? taskId;
            const resolvedDestinationType = res.destinationType ?? destinationType;
            const resolvedDestinationId = res.destinationId ?? destinationId;

            await opts.onMoveTaskSuccess({
              movedTaskId,
              destinationType: resolvedDestinationType,
              destinationId: resolvedDestinationId,
            });

            return true;
          } catch (error) {
            console.error("Failed to move task", error);
            showErrorToast("Error", "Failed to move task.");
            return false;
          }
        },
        projectSearch: opts.projectSearch,
        spaceSearch: opts.spaceSearch,

        assigneePersonSearch: ctx.assigneePersonSearch,
        richTextHandlers: ctx.richTextHandlers,
        localDraftKeyBase: `task:${taskId}`,

        canEdit,

        currentUser: parsedCurrentUser,
        timelineItems: currentTimelineItems,
        timelineIsLoading: currentTimelineIsLoading,
        canComment: canComment,

        onAddComment: (content) => {
          if (activeTaskId !== taskId) return false;
          return addComment(content);
        },
        onEditComment: (commentId, content) => {
          if (activeTaskId !== taskId) return false;
          return editComment(commentId, content);
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
        formattedTimePreferences,
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
      opts.onMoveTaskSuccess,
      subscriptions,
      opts.projectSearch,
      opts.spaceSearch,
      formattedTimePreferences,
    ],
  );

  return React.useMemo(
    () => ({
      getTaskPageProps,
      onTaskNameChange: wrapNameChange,
      onTaskAssigneeChange: wrapAssigneeChange,
      onTaskDueDateChange: wrapDueDateChange,
      onTaskRemindersChange: wrapRemindersChange,
      onTaskStatusChange: wrapStatusChange,
      onTaskDescriptionChange: wrapDescriptionChange,
    }),
    [
      getTaskPageProps,
      wrapAssigneeChange,
      wrapDescriptionChange,
      wrapDueDateChange,
      wrapNameChange,
      wrapRemindersChange,
      wrapStatusChange,
    ],
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
