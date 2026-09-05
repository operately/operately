import * as React from "react";
import { useNavigate } from "react-router";
import type { ProjectsCreateMilestoneCommentInput, ProjectsCreateMilestoneCommentResult } from "@/api";

import * as Time from "@/utils/time";
import * as People from "@/models/people";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as Projects from "@/models/projects";
import * as Activities from "@/models/activities";
import { parseActivitiesForTurboUi } from "@/models/activities/feed";

import { showErrorToast, MilestonePage, Timeline } from "turboui";
import { Paths, usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { assertPresent } from "@/utils/assertions";
import { parseSpaceForTurboUI, useSpaceSearch as useTaskDestinationSpaceSearch } from "@/models/spaces";
import { PageModule } from "@/routes/types";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { projectPageCacheKey } from "../ProjectPage";
import { useComments } from "./useComments";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useSubscription } from "@/models/subscriptions";
import { useMilestones as useProjectMilestones } from "@/models/milestones/useMilestones";
import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "MilestonePage", loader, Page } as PageModule;

type TurboUiComment = Timeline.Comment | Timeline.MilestoneActivity;

function Page() {
  const paths = usePaths();
  const currentUser = useMe();
  const navigate = useNavigate();

  const { milestone, childrenCount, activities, tasks: backendTasks } = useLoadedData();
  const refreshPageData = useRefresh();

  assertPresent(milestone.project, "Milestone must have a project");
  assertPresent(milestone.permissions, "Milestone must have permissions");
  const projectId = milestone.project.id;
  const updateProjectName = Projects.useUpdateProjectName();
  const updateMilestoneDescription = Milestones.useUpdateMilestoneDescription();
  const updateMilestoneDueDate = Milestones.useUpdateMilestoneDueDate();
  const deleteMilestone = Milestones.useDeleteMilestone();

  const spaceProps = milestone.space
    ? {
        workmapLink: paths.spaceWorkMapPath(milestone.space.id, "projects" as const),
        space: parseSpaceForTurboUI(paths, milestone.space),
      }
    : { homeLink: paths.homePath() };

  const [projectName, setProjectName] = usePageField({
    queryData: milestone,
    value: () => milestone.project?.name ?? "",
    update: async (name) => {
      await updateProjectName.mutateAsync({ projectId, name });
      await refreshPageData();
    },
    onError: (e) => showErrorToast(errorMessage(e), "Reverted the project name to its previous value."),
    validations: [(v) => (v?.trim() === "" ? "Project name cannot be empty" : null)],
    projectIdToInvalidate: projectId,
  });

  const [description, setDescription] = usePageField({
    queryData: milestone,
    value: () => milestone.description && JSON.parse(milestone.description),
    update: (v) =>
      updateMilestoneDescription.mutateAsync({ milestoneId: milestone.id, description: JSON.stringify(v) }),
    onError: () => showErrorToast("Error", "Failed to update milestone description."),
    projectIdToInvalidate: projectId,
  });

  const [dueDate, setDueDate] = usePageField({
    queryData: milestone,
    value: () => parseContextualDate(milestone.timeframe?.contextualEndDate),
    update: (v) =>
      updateMilestoneDueDate.mutateAsync({ milestoneId: milestone.id, dueDate: serializeContextualDate(v) }),
    onError: (e) => showErrorToast(errorMessage(e), "Failed to update milestone due date."),
    projectIdToInvalidate: projectId,
  });

  const { parsedMilestone, milestones, setMilestones, title, setTitle } = useMilestones(milestone, projectId);

  const {
    tasks,
    createTask,
    updateTaskAssignee,
    updateTaskDueDate,
    updateTaskReminders,
    updateTaskStatus,
    updateTaskMilestone,
    updateTaskName,
    updateTaskDescription,
    deleteTask,
  } = Tasks.useProjectTasksForTurboUi({
    backendTasks,
    projectId: milestone.project.id,
    milestones: milestones,
    setMilestones: setMilestones,
  });
  const {
    comments,
    setComments,
    handleCreateComment,
    handleEditComment,
    handleDeleteComment,
    handleAddReaction,
    handleRemoveReaction,
  } = useComments(paths, milestone, refreshPageData);
  const [status, setStatus] = useStatusField(paths, milestone, setComments, projectId);

  const timelineItems = React.useMemo(
    () => prepareTimelineItems(paths, activities, comments),
    [paths, activities, comments],
  );

  const handleDelete = React.useCallback(async () => {
    await deleteMilestone.mutateAsync({ milestoneId: milestone.id });

    if (milestone.project) {
      PageCache.invalidate(projectPageCacheKey(milestone.project.id));
      navigate(paths.projectPath(milestone.project.id, { tab: "tasks" }));
    } else {
      navigate(paths.homePath());
    }
  }, [deleteMilestone, milestone.id, milestone.project, navigate, paths]);

  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "project", id: milestone.project.id } });
  const formattedTimePreferences = useFormattedTimePreferences();
  const { milestones: searchableMilestones, search: searchMilestones } = useProjectMilestones(milestone.project.id);
  const taskProjectSearch = Projects.useProjectSearch({
    accessLevel: "edit_access",
    ignoredIds: [milestone.project.id],
    activeOnly: true,
  });
  const taskSpaceSearch = useTaskDestinationSpaceSearch({ accessLevel: "edit_access", withTasksEnabledOnly: true });

  // Transform function must be memoized to prevent infinite loop in the hook
  const transformPerson = React.useCallback((p) => People.parsePersonForTurboUi(paths, p)!, [paths]);

  const assigneeSearch = Tasks.useTaskAssigneeSearch({
    id: milestone.project.id,
    type: "project",
    transformResult: transformPerson,
  });

  const subscriptions = useSubscription({
    subscriptionList: milestone.subscriptionList,
    entityId: milestone.id,
    entityType: "milestone",
    onRefresh: refreshPageData,
  });

  const handleMoveTaskSuccess = React.useCallback(
    async ({ destinationType, destinationId }: { destinationType: string; destinationId: string }) => {
      if (milestone.project?.id) {
        PageCache.invalidate(projectPageCacheKey(milestone.project.id));
      }

      if (destinationType === "project") {
        PageCache.invalidate(projectPageCacheKey(destinationId));
      }

      await refreshPageData();
    },
    [milestone.project?.id, refreshPageData],
  );

  const handleTaskMilestoneChange = React.useCallback(
    async (taskId: string, nextMilestone: MilestonePage.Milestone | null) => {
      const result = await updateTaskMilestone(taskId, nextMilestone?.id ?? null, 1000);

      if (!result) return;

      PageCache.invalidate(projectPageCacheKey(projectId));
    },
    [projectId, updateTaskMilestone],
  );

  const handleTaskDelete = React.useCallback(
    async (taskId: string) => {
      const result = await deleteTask(taskId);

      if (!result?.success) return;

      PageCache.invalidate(projectPageCacheKey(projectId));
    },
    [deleteTask, projectId],
  );

  const slideInModel = Tasks.useTaskSlideInProps({
    backendTasks,
    paths,
    currentUser,
    tasks,
    commentEntityType: "project_task",
    onRefresh: refreshPageData,
    canEdit: Boolean(milestone.permissions.canEdit),
    canComment: Boolean(milestone.permissions.canComment),
    variant: "project-task",
    onTaskNameChange: updateTaskName,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,
    onTaskRemindersChange: updateTaskReminders,
    onTaskStatusChange: updateTaskStatus,
    onTaskDescriptionChange: updateTaskDescription,
    onMoveTaskSuccess: handleMoveTaskSuccess,
    projectSearch: taskProjectSearch,
    spaceSearch: taskSpaceSearch,
  });

  const statusOptions = React.useMemo(
    () => Tasks.parseTaskStatusesForTurboUi(milestone.availableStatuses),
    [milestone.availableStatuses],
  );

  const props: MilestonePage.Props = {
    variant: "project",
    ...spaceProps,
    childrenCount,
    permissions: milestone.permissions,

    assigneePersonSearch: assigneeSearch,

    // Project
    projectName,
    projectLink: paths.projectPath(milestone.project.id),
    projectStatus: milestone.project.status,
    updateProjectName: setProjectName,

    // Milestone data
    milestone: parsedMilestone,

    // Timeline/Comments
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
    timelineItems,
    onAddComment: handleCreateComment,
    onEditComment: handleEditComment,
    onDeleteComment: handleDeleteComment,
    onAddReaction: handleAddReaction,
    onRemoveReaction: handleRemoveReaction,
    localDraftKeyBase: `milestone:${milestone.id}`,

    // Core milestone data
    title,
    onMilestoneTitleChange: setTitle,
    description,
    onDescriptionChange: setDescription,
    dueDate,
    onDueDateChange: setDueDate,
    status,
    onStatusChange: setStatus,

    onDelete: handleDelete,

    // Tasks
    tasks,
    statusOptions,
    onTaskCreate: createTask,
    onTaskReorder: updateTaskMilestone,
    onTaskMilestoneChange: handleTaskMilestoneChange,
    onTaskStatusChange: slideInModel.onTaskStatusChange,
    onTaskAssigneeChange: slideInModel.onTaskAssigneeChange,
    onTaskDueDateChange: slideInModel.onTaskDueDateChange,
    onTaskRemindersChange: slideInModel.onTaskRemindersChange,
    onTaskNameChange: slideInModel.onTaskNameChange,
    onTaskDescriptionChange: slideInModel.onTaskDescriptionChange,
    onTaskDelete: handleTaskDelete,
    milestones: searchableMilestones,
    onMilestoneSearch: searchMilestones,
    getTaskPageProps: slideInModel.getTaskPageProps,

    // Metadata
    createdBy: People.parsePersonForTurboUi(paths, milestone.creator),
    createdAt: Time.parseDate(milestone.insertedAt)!,

    // Subscriptions
    subscriptions,

    // Rich text editor support
    richTextHandlers: richEditorHandlers,
    formattedTimePreferences,
  };

  return <MilestonePage key={milestone.id!} {...props} />;
}

interface UsePageFieldProps<T, Command> {
  queryData: Milestones.Milestone;
  value: () => T;
  update: (command: Command) => Promise<any>;
  optimisticValue?: (command: Command) => T;
  onError?: (error: unknown) => void;
  validations?: ((value: T) => string | null)[];
  projectIdToInvalidate?: string;
}

function usePageField<T, Command = T>({
  queryData,
  value,
  update,
  optimisticValue,
  onError,
  validations,
  projectIdToInvalidate,
}: UsePageFieldProps<T, Command>): [T, (command: Command) => Promise<boolean>] {
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const [state, setState] = React.useState<T>(() => value());

  React.useEffect(() => {
    setState(valueRef.current());
  }, [queryData]);

  const updateState = async (command: Command): Promise<boolean> => {
    const newVal = optimisticValue ? optimisticValue(command) : (command as unknown as T);

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
      await update(command);
      if (projectIdToInvalidate) {
        PageCache.invalidate(projectPageCacheKey(projectIdToInvalidate));
      }

      return true;
    } catch (error) {
      setState(previousValue);
      onError?.(error);
      return false;
    }
  };

  return [state, updateState];
}

function prepareTimelineItems(paths: Paths, activities: Activities.Activity[], comments: TurboUiComment[]) {
  const parsedActivities: MilestonePage.TimelineItemType[] = parseActivitiesForTurboUi(paths, activities, "milestone")
    .filter((activity): activity is NonNullable<typeof activity> => activity !== null)
    .map((activity) => {
      if (activity.type.startsWith("task_")) {
        return { type: "task-activity", value: activity as any };
      } else {
        return { type: "milestone-activity", value: activity as any };
      }
    });

  const timelineItems = comments.map((comment) => {
    const type = "type" in comment ? "milestone-activity" : "comment";

    return { type, value: comment } as MilestonePage.TimelineItemType;
  });

  return [...parsedActivities, ...timelineItems].sort((a, b) => {
    // Special handling for temporary comments - always show them last
    const aIsTemp = a.value.id.startsWith("temp-");
    const bIsTemp = b.value.id.startsWith("temp-");

    // If one is temporary and the other isn't, prioritize the non-temporary one
    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;

    const aInsertedAt = a.type === "acknowledgment" ? a.insertedAt : a.value.insertedAt;
    const bInsertedAt = b.type === "acknowledgment" ? b.insertedAt : b.value.insertedAt;

    return aInsertedAt.localeCompare(bInsertedAt);
  });
}

function useStatusField(
  paths: Paths,
  milestone: Milestones.Milestone,
  setComments: React.Dispatch<React.SetStateAction<TurboUiComment[]>>,
  projectId: string,
) {
  const me = useMe()!;
  const createMilestoneComment = Milestones.useCreateMilestoneComment();

  type StatusUpdate = {
    status: MilestonePage.Status;
    resolution?: MilestonePage.OpenTasksResolution;
  };

  const [status, updateStatus] = usePageField<MilestonePage.Status, StatusUpdate>({
    queryData: milestone,
    value: () => milestone.status,
    optimisticValue: (command) => command.status,
    update: ({ status: nextStatus, resolution }) =>
      updateMilestoneStatus({
        paths,
        milestone,
        me,
        setComments,
        nextStatus,
        resolution,
        createComment: (input) => createMilestoneComment.mutateAsync(input),
      }),
    onError: (e) => showErrorToast(errorMessage(e), "Failed to update milestone status."),
    projectIdToInvalidate: projectId,
  });

  const setStatus = (nextStatus: MilestonePage.Status, resolution?: MilestonePage.OpenTasksResolution) =>
    updateStatus({ status: nextStatus, resolution });

  return [status, setStatus] as const;
}

interface UpdateMilestoneStatusParams {
  paths: Paths;
  milestone: Milestones.Milestone;
  me: NonNullable<Milestones.MilestoneComment["comment"]["author"]>;
  setComments: React.Dispatch<React.SetStateAction<TurboUiComment[]>>;
  nextStatus: MilestonePage.Status;
  resolution?: MilestonePage.OpenTasksResolution;
  createComment: (input: ProjectsCreateMilestoneCommentInput) => Promise<ProjectsCreateMilestoneCommentResult>;
}

export async function updateMilestoneStatus({
  paths,
  milestone,
  me,
  setComments,
  nextStatus,
  resolution,
  createComment,
}: UpdateMilestoneStatusParams): Promise<void> {
  const tmpId = `temp-${crypto.randomUUID()}`;
  const optimisticComment: Milestones.MilestoneComment = {
    __typename: "milestone_comment",
    action: nextStatus === "done" ? "complete" : "reopen",
    comment: {
      __typename: "comment",
      id: tmpId,
      insertedAt: new Date().toISOString(),
      author: me,
    },
  };

  setComments((prev) => [...prev, Milestones.parseMilestoneCommentForTurboUi(paths, optimisticComment)]);

  try {
    const res = await createComment({
      milestoneId: milestone.id,
      content: null,
      action: nextStatus === "done" ? "complete" : "reopen",
      openTasksResolution: serializeOpenTasksResolution(resolution),
    });

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === tmpId) {
          const savedComment = { ...res.comment.comment, author: me };
          return Milestones.parseMilestoneCommentForTurboUi(paths, { ...res.comment, comment: savedComment });
        } else {
          return comment;
        }
      }),
    );
  } catch (error) {
    setComments((prev) => prev.filter((comment) => comment.id !== tmpId));
    throw error;
  }
}

function serializeOpenTasksResolution(resolution?: MilestonePage.OpenTasksResolution) {
  if (!resolution) return null;

  if (resolution.action === "move_to_no_milestone") {
    return { action: resolution.action, statusId: null };
  }

  return { action: resolution.action, statusId: resolution.status.id };
}

function useMilestones(milestone: Milestones.Milestone, projectId: string) {
  const paths = usePaths();
  const updateMilestoneTitle = Milestones.useUpdateMilestoneTitle();
  const [milestones, setMilestones] = React.useState<MilestonePage.Milestone[]>(
    Milestones.parseMilestonesForTurboUi(paths, [milestone]).orderedMilestones,
  );

  React.useEffect(() => {
    setMilestones(Milestones.parseMilestonesForTurboUi(paths, [milestone]).orderedMilestones);
  }, [milestone, paths]);

  const parsedMilestone = milestones[0]!;

  const [title, setTitle] = usePageField({
    queryData: milestone,
    value: () => milestone.title,
    update: (v) => updateMilestoneTitle.mutateAsync({ milestoneId: milestone.id, title: v }),
    onError: (e) => showErrorToast(errorMessage(e), "Failed to update milestone name."),
    validations: [(v) => (v.trim() === "" ? "Milestone name cannot be empty" : null)],
    projectIdToInvalidate: projectId,
  });

  return {
    title,
    setTitle,
    parsedMilestone,
    milestones,
    setMilestones,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
