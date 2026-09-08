import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { DateField, TaskBoard, TaskPage, showErrorToast } from "turboui";
import { useOptimisticComments } from "@/models/comments/useOptimisticComments";
import * as People from "@/models/people";
import { compareIds, Paths } from "@/routes/paths";

import { useTaskTimelineItems, invalidateTaskTimelineQueries } from "./useTaskTimelineItems";
import { prepareTaskTimelineItems } from "./prepareTaskTimelineItems";
import { type Person as ApiPerson, type Task as BackendTask } from "@/api";
import { useSubscription } from "@/models/subscriptions";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useMoveTask } from "./taskLifecycle";

export function useTaskSlideInProps(opts: {
  backendTasks: BackendTask[];
  paths: Paths;
  currentUser: ApiPerson | null;
  tasks: TaskBoard.Task[];

  commentEntityType: "project_task" | "space_task";
  onRefresh?: () => Promise<void>;

  canEdit: boolean;
  canComment: boolean;
  variant: Extract<TaskPage.Variant, "space-task" | "project-task">;

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
  const { backendTasks, paths, currentUser, canEdit, canComment, variant, commentEntityType } = opts;
  const queryClient = useQueryClient();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mutateAsync: moveTask } = useMoveTask();

  const parsedCurrentUser = currentUser ? (People.parsePersonForTurboUi(paths, currentUser) ?? undefined) : undefined;

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);
  const lastSeenTaskIdRef = React.useRef<string | null>(null);
  const activeBackendTask = React.useMemo(
    () => backendTasks.find((task) => activeTaskId && compareIds(task.id, activeTaskId)) ?? null,
    [activeTaskId, backendTasks],
  );

  const subscriptions = useSubscription({
    subscriptionList: activeBackendTask?.subscriptionList,
    entityId: activeBackendTask?.id ?? "",
    entityType: commentEntityType,
    onRefresh: opts.onRefresh,
  });

  const {
    activities,
    comments: fetchedComments,
    isLoading: isTimelineLoading,
  } = useTaskTimelineItems(activeTaskId, commentEntityType);

  const { comments, addComment, editComment, deleteComment, addReaction, removeReaction } = useOptimisticComments({
    taskId: activeTaskId,
    parentType: commentEntityType,
    initialComments: fetchedComments,
  });

  const refreshTimeline = React.useCallback(
    async (taskId: string) => {
      await invalidateTaskTimelineQueries(queryClient, taskId, commentEntityType);
    },
    [queryClient, commentEntityType],
  );

  const wrapNameChange = React.useCallback(
    async (taskId: string, name: string) => {
      const saved = await opts.onTaskNameChange(taskId, name);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskNameChange, refreshTimeline],
  );

  const wrapAssigneeChange = React.useCallback(
    async (taskId: string, assignees: TaskBoard.Person[]) => {
      const saved = await opts.onTaskAssigneeChange(taskId, assignees);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskAssigneeChange, refreshTimeline],
  );

  const wrapDueDateChange = React.useCallback(
    async (taskId: string, dueDate: DateField.ContextualDate | null) => {
      const saved = await opts.onTaskDueDateChange(taskId, dueDate);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskDueDateChange, refreshTimeline],
  );

  const wrapRemindersChange = React.useCallback(
    async (taskId: string, reminders: TaskPage.Reminder[]) => {
      const saved = await opts.onTaskRemindersChange(taskId, reminders);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskRemindersChange, refreshTimeline],
  );

  const wrapStatusChange = React.useCallback(
    async (taskId: string, status: TaskBoard.Status | null) => {
      const saved = await opts.onTaskStatusChange(taskId, status);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskStatusChange, refreshTimeline],
  );

  const wrapDescriptionChange = React.useCallback(
    async (taskId: string, content: unknown) => {
      const saved = await opts.onTaskDescriptionChange(taskId, content);
      if (saved) await refreshTimeline(taskId);
      return saved;
    },
    [opts.onTaskDescriptionChange, refreshTimeline],
  );

  const getTaskPageProps = React.useCallback(
    (taskId: string, ctx: any): TaskPage.ContentProps | null => {
      const task = ctx.tasks.find((t) => compareIds(t.id, taskId));
      if (!task) return null;

      if (lastSeenTaskIdRef.current !== taskId) {
        lastSeenTaskIdRef.current = taskId;
        setTimeout(() => setActiveTaskId(taskId), 0);
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

      const currentTimelineItems = activeTaskId === taskId ? prepareTaskTimelineItems(paths, activities, comments) : [];
      const currentTimelineIsLoading = activeTaskId === taskId ? isTimelineLoading : true;

      const milestoneProps = buildMilestoneProps({ variant, taskId, ctx, taskMilestone: task.milestone });

      return {
        variant,
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
            const res = await moveTask({ taskId, destinationType, destinationId });
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
      backendTasks,
      canComment,
      canEdit,
      addComment,
      addReaction,
      deleteComment,
      editComment,
      variant,
      isTimelineLoading,
      removeReaction,
      parsedCurrentUser,
      paths,
      activities,
      comments,
      opts.onMoveTaskSuccess,
      moveTask,
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

type MilestoneProps = Pick<
  TaskPage.ContentProps,
  "milestone" | "onMilestoneChange" | "milestones" | "onMilestoneSearch"
>;

function buildMilestoneProps(opts: {
  variant: Extract<TaskPage.Variant, "space-task" | "project-task">;
  taskId: string;
  ctx: any;
  taskMilestone: TaskBoard.Milestone | null;
}): MilestoneProps {
  if (opts.variant === "space-task") {
    return {
      milestone: null,
      onMilestoneChange: () => {},
      milestones: [],
      onMilestoneSearch: async () => {},
    };
  }

  return {
    milestone: opts.taskMilestone ? toTaskPageMilestone(opts.taskMilestone) : null,
    onMilestoneChange: (m) => opts.ctx.onTaskMilestoneChange?.(opts.taskId, m),
    milestones: (opts.ctx.milestones ?? []).map((m: any) => ({ ...m, dueDate: m.dueDate ?? null })),
    onMilestoneSearch: opts.ctx.onMilestoneSearch,
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
