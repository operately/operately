import React, { useMemo, useCallback } from "react";
import Api from "@/api";

import { useNavigate } from "react-router";
import * as Tasks from "@/models/tasks";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";
import * as Comments from "@/models/comments";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { parseMilestoneForTurboUi } from "@/models/milestones";
import * as Time from "@/utils/time";

import { usePaths } from "../../routes/paths";
import { showErrorToast, TaskPage } from "turboui";
import { PageModule } from "../../routes/types";
import { PageCache } from "@/routes/PageCache";
import { assertPresent } from "@/utils/assertions";
import { projectPageCacheKey } from "../ProjectPage";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { useSpaceSearch } from "@/models/spaces";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useMilestones } from "@/models/milestones/useMilestones";
import { useSubscription } from "@/models/subscriptions";
import { StatusSelector } from "turboui";
import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "TaskPage", loader, Page } as PageModule;

function pageCacheKey(id: string): string {
  return `v9-TaskV2Page.task-${id}`;
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const currentUser = useMe();

  const { task, childrenCount, activities, comments: initialComments } = useLoadedData();
  const refreshPageData = useRefresh();

  const updateTaskName = Tasks.useUpdateTaskName();
  const updateTaskDescription = Tasks.useUpdateTaskDescription();
  const updateTaskStatus = Tasks.useUpdateTaskStatus();
  const updateTaskDueDate = Tasks.useUpdateTaskDueDate();
  const updateTaskReminders = Tasks.useUpdateTaskReminders();
  const updateTaskAssignee = Tasks.useUpdateTaskAssignee();
  const updateTaskMilestone = Tasks.useUpdateTaskMilestone();
  const deleteTask = Tasks.useDeleteTask();

  assertPresent(task.project, "Task must have a project");
  assertPresent(task.permissions, "Task must have permissions");
  const project = task.project;

  const spaceProps = task.projectSpace
    ? {
        workmapLink: paths.spaceWorkMapPath(task.projectSpace.id, "projects" as const),
        space: parseSpaceForTurboUI(paths, task.projectSpace),
      }
    : { homeLink: paths.homePath() };

  const [projectName, setProjectName] = usePageField({
    queryData: task,
    value: () => project.name,
    update: (v) => Api.projects.updateName({ projectId: project.id, name: v }),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Project name cannot be empty" : null)],
    refreshPageData,
    projectIdToInvalidate: project.id,
  });

  const [name, setName] = usePageField({
    queryData: task,
    value: () => task.name,
    update: (v) => updateTaskName.mutateAsync({ taskId: task.id, name: v, type: "project" }),
    onError: (e: string) => showErrorToast(e, "Failed to update task name."),
    validations: [(v) => (v.trim() === "" ? "Task name cannot be empty" : null)],
    refreshPageData,
  });

  const [description, setDescription] = usePageField({
    queryData: task,
    value: () => task.description && JSON.parse(task.description),
    update: (v) =>
      updateTaskDescription.mutateAsync({ taskId: task.id, description: JSON.stringify(v), type: "project" }),
    onError: () => showErrorToast("Error", "Failed to update task description."),
    refreshPageData,
  });

  const [status, setStatus] = usePageField({
    queryData: task,
    value: () => Tasks.parseTaskForTurboUi(paths, task, { type: "project" }).status,
    update: (v) =>
      updateTaskStatus.mutateAsync({ taskId: task.id, status: Tasks.serializeTaskStatus(v), type: "project" }),
    onError: () => showErrorToast("Error", "Failed to update task status."),
    refreshPageData,
  });

  const [dueDate, setDueDate] = usePageField({
    queryData: task,
    value: () => parseContextualDate(task.dueDate),
    update: (v) =>
      updateTaskDueDate.mutateAsync({ taskId: task.id, dueDate: serializeContextualDate(v), type: "project" }),
    onError: () => showErrorToast("Error", "Failed to update due date."),
    refreshPageData,
  });

  const [reminders, setReminders] = usePageField<TaskPage.Reminder[]>({
    queryData: task,
    value: () => Tasks.parseTaskReminders(task.reminders),
    update: (v) =>
      updateTaskReminders.mutateAsync({
        taskId: task.id,
        reminders: Tasks.serializeTaskReminders(v),
        type: "project",
      }),
    onError: () => showErrorToast("Error", "Failed to update task reminders."),
    refreshPageData,
  });

  const [assignees, setAssignees] = usePageField<TaskPage.Person[]>({
    queryData: task,
    value: () =>
      (task.assignees || []).flatMap((assignee) => {
        const parsed = People.parsePersonForTurboUi(paths, assignee);
        return parsed ? [parsed] : [];
      }),
    update: (v) =>
      updateTaskAssignee.mutateAsync({
        taskId: task.id,
        assigneeIds: v.map((assignee) => assignee.id),
        type: "project",
      }),
    onError: () => showErrorToast("Error", "Failed to update assignees."),
    refreshPageData,
  });

  const [milestone, setMilestone] = usePageField<TaskPage.Milestone | null>({
    queryData: task,
    value: () => (task.milestone ? parseMilestoneForTurboUi(paths, task.milestone) : null),
    update: (v) => updateTaskMilestone.mutateAsync({ taskId: task.id, milestoneId: v?.id ?? null }),
    onError: () => showErrorToast("Error", "Failed to update milestone."),
    refreshPageData,
  });

  const { comments, addComment, editComment, deleteComment, addReaction, removeReaction } =
    Comments.useOptimisticComments({
      taskId: task.id,
      parentType: "project_task",
      initialComments,
      onAfterMutation: () => {
        void refreshPageData();
      },
    });

  const timelineItems = useMemo(
    () => Tasks.prepareTaskTimelineItems(paths, activities, comments),
    [paths, activities, comments],
  );

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync({ taskId: task.id, type: "project" });

      if (task.project) {
        PageCache.invalidate(projectPageCacheKey(task.project.id));
        navigate(paths.projectPath(task.project.id, { tab: "tasks" }));
      } else {
        navigate(paths.homePath());
      }
    } catch (error) {
      showErrorToast("Error", "Failed to delete task.");
    }
  };

  // Transform function must be memoized to prevent infinite loop in the hook
  const transformPerson = useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  const assigneePersonSearch = Tasks.useTaskAssigneeSearch({
    id: task.project.id,
    type: "project",
    transformResult: transformPerson,
  });
  const { milestones, search: searchMilestones } = useMilestones(task.project.id);
  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "project", id: task.project.id } });
  const formattedTimePreferences = useFormattedTimePreferences();

  const projectSearch = Projects.useProjectSearch({
    accessLevel: "edit_access",
    ignoredIds: [task.project.id],
    activeOnly: true,
  });
  const spaceSearch = useSpaceSearch({ accessLevel: "edit_access", withTasksEnabledOnly: true });
  const moveTask = useMoveTaskHandler(task, refreshPageData);

  const subscriptions = useSubscription({
    subscriptionList: task.subscriptionList,
    entityType: "project_task",
    entityId: task.id,
    cacheKey: pageCacheKey(task.id),
    onRefresh: refreshPageData,
  });

  const statusOptions = useMemo<StatusSelector.StatusOption[]>(
    () => Tasks.parseTaskStatusesForTurboUi(task.availableStatuses),
    [task.availableStatuses],
  );

  const props: TaskPage.Props = {
    variant: "project-task",
    projectName,
    projectLink: paths.projectPath(task.project.id),
    projectStatus: task.project.status,
    ...spaceProps,
    childrenCount,

    permissions: task.permissions,
    canEdit: Boolean(task.permissions.canEdit),
    canComment: Boolean(task.permissions.canComment),

    assigneePersonSearch,
    updateProjectName: setProjectName,

    // Timeline/Comments
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
    timelineItems,
    onAddComment: addComment,
    onEditComment: editComment,
    onDeleteComment: deleteComment,
    onAddReaction: addReaction,
    onRemoveReaction: removeReaction,

    // Milestone selection
    milestone,
    onMilestoneChange: setMilestone,
    milestones,
    onMilestoneSearch: searchMilestones,

    // Core task data
    name: name as string,
    onNameChange: setName,
    description,
    onDescriptionChange: setDescription,
    status,
    onStatusChange: setStatus,
    statusOptions,
    dueDate: dueDate || undefined,
    onDueDateChange: setDueDate,
    reminders,
    onRemindersChange: setReminders,
    assignees,
    onAssigneesChange: setAssignees,

    onDelete: handleDelete,
    onMoveTask: moveTask,
    projectSearch,
    spaceSearch,

    // Metadata
    createdAt: new Date(task.insertedAt || Date.now()),
    createdBy: People.parsePersonForTurboUi(paths, task.creator) as TaskPage.Person,
    closedAt: Time.parse(task.project.closedAt),

    // Subscription
    subscriptions,

    richTextHandlers: richEditorHandlers,
    localDraftKeyBase: `task:${task.id}`,
    formattedTimePreferences,
  };

  return <TaskPage key={task.id} {...props} />;
}

interface UsePageFieldProps<T> {
  queryData: Tasks.Task;
  value: () => T;
  update: (newValue: T) => Promise<any>;
  onError: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
  refreshPageData: () => Promise<void>;
  projectIdToInvalidate?: string;
}

function usePageField<T>({
  queryData,
  value,
  update,
  onError,
  validations,
  refreshPageData,
  projectIdToInvalidate,
}: UsePageFieldProps<T>): [T, (v: T) => Promise<boolean>] {
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const [state, setState] = React.useState<T>(value);

  React.useEffect(() => {
    setState(valueRef.current());
  }, [queryData]);

  const updateState = async (newVal: T): Promise<boolean> => {
    if (validations) {
      for (const validation of validations) {
        const error = validation(newVal);
        if (error) {
          onError?.(error);
          return false;
        }
      }
    }

    const previousValue = state;

    setState(newVal);

    try {
      const result = await update(newVal);

      if (result === false || (typeof result === "object" && result?.success === false)) {
        setState(previousValue);
        onError("Update failed");
        return false;
      }

      await refreshPageData();

      if (projectIdToInvalidate) {
        PageCache.invalidate(projectPageCacheKey(projectIdToInvalidate));
      }

      return true;
    } catch (error) {
      setState(previousValue);
      onError(error);
      return false;
    }
  };

  return [state, updateState];
}

function useMoveTaskHandler(task: Tasks.Task, refreshPageData: () => Promise<void>) {
  const navigate = useNavigate();
  const paths = usePaths();
  const moveTask = Tasks.useMoveTask();

  return useCallback(
    async ({ destinationType, destinationId }: TaskPage.MoveTaskInput) => {
      try {
        const res = await moveTask.mutateAsync({ taskId: task.id, destinationType, destinationId });
        const movedTaskId = res.task?.id ?? task.id;
        const resolvedDestinationType = res.destinationType ?? destinationType;
        const resolvedDestinationId = res.destinationId ?? destinationId;

        if (task.project?.id) {
          PageCache.invalidate(projectPageCacheKey(task.project.id));
        }

        if (resolvedDestinationType !== "space") {
          PageCache.invalidate(projectPageCacheKey(resolvedDestinationId));
        }

        if (resolvedDestinationType === "space") {
          navigate(paths.spaceKanbanPath(resolvedDestinationId, { taskId: movedTaskId }));
        } else {
          await refreshPageData();
          navigate(paths.taskPath(movedTaskId));
        }

        return true;
      } catch (error) {
        console.error("Failed to move task", error);
        showErrorToast("Error", "Failed to move task.");
        return false;
      }
    },
    [moveTask, navigate, paths, task.id, task.project?.id, refreshPageData],
  );
}
