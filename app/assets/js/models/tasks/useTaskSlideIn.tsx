import * as React from "react";
import Api from "@/api";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import * as Milestones from "@/models/milestones";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";
import { showErrorToast, TaskSlideIn } from "turboui";
import type { Paths } from "@/routes/paths";

interface UseTaskSlideInParams {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  paths: Paths;
  currentUser: any;
}

/**
 * Hook for managing task slide-in with data loading and caching
 */
export function useTaskSlideIn({ taskId, isOpen, onClose, paths, currentUser }: UseTaskSlideInParams) {
  const [taskDataCache, setTaskDataCache] = React.useState<Map<string, any>>(new Map());
  const [loadingTaskId, setLoadingTaskId] = React.useState<string | null>(null);
  const [taskData, setTaskData] = React.useState<any>(null);

  // Load task data when a task is selected
  React.useEffect(() => {
    if (!taskId || !isOpen) {
      setTaskData(null);
      setLoadingTaskId(null);
      return;
    }

    // Check cache first
    if (taskDataCache.has(taskId)) {
      setTaskData(taskDataCache.get(taskId));
      setLoadingTaskId(null);
      return;
    }

    // Load task data
    setLoadingTaskId(taskId);
    loadTaskData(taskId, paths, currentUser)
      .then((data) => {
        setTaskData(data);
        setTaskDataCache((prev) => new Map(prev).set(taskId, data));
        setLoadingTaskId(null);
      })
      .catch((error) => {
        console.error("Failed to load task data", error);
        showErrorToast("Error", "Failed to load task details");
        setLoadingTaskId(null);
        onClose();
      });
  }, [taskId, isOpen, taskDataCache, onClose, paths, currentUser]);

  const closeTaskSlideIn = React.useCallback(() => {
    setTaskData(null);
    setLoadingTaskId(null);
    onClose();
  }, [onClose]);

  if (!isOpen || !taskId) {
    return { taskSlideInProps: null, closeTaskSlideIn };
  }

  const isLoading = loadingTaskId === taskId || !taskData;

  // Build task slide-in props
  const taskSlideInProps: TaskSlideIn.Props = {
    isOpen,
    onClose: closeTaskSlideIn,
    isLoading,
    taskId,
    ...(taskData || {}),
  };

  return { taskSlideInProps, closeTaskSlideIn };
}

/**
 * Load task data from API
 */
async function loadTaskData(taskId: string, paths: Paths, currentUser: any) {
  const [task, activities, comments] = await Promise.all([
    Tasks.getTask({
      id: taskId,
      includeProject: true,
      includeMilestone: true,
      includeAssignees: true,
      includeCreator: true,
      includeSpace: true,
      includePermissions: true,
      includeSubscriptionList: true,
      includeAvailableStatuses: true,
    }).then((d) => d.task!),
    Api.getActivities({
      scopeId: taskId,
      scopeType: "task",
      actions: TASK_ACTIVITY_TYPES,
    }).then((d) => d.activities!),
    Api.getComments({
      entityId: taskId,
      entityType: "project_task",
    }).then((d) => d.comments!),
  ]);

  const timelineItems = Tasks.parseTimelineItems(paths, activities, comments);

  // Transform the data to match TaskPage.Props format
  return {
    name: task.name,
    description: task.description && JSON.parse(task.description),
    status: Tasks.parseTaskForTurboUi(paths, task).status,
    statusOptions: Tasks.parseTaskStatusesForTurboUi(task.availableStatuses),
    dueDate: task.dueDate,
    assignee: task.assignees?.[0] ? People.parsePersonForTurboUi(paths, task.assignees[0]) : null,
    createdAt: new Date(task.insertedAt || Date.now()),
    createdBy: People.parsePersonForTurboUi(paths, task.creator),
    milestone: task.milestone ? Milestones.parseMilestoneForTurboUi(paths, task.milestone) : null,

    // Timeline data
    timelineItems,
    currentUser,
    canComment: Boolean(task.permissions?.canComment),

    // Read-only mode - no handlers for now
    canEdit: false,
    onNameChange: async () => false,
    onDescriptionChange: async () => false,
    onStatusChange: () => {},
    onDueDateChange: () => {},
    onAssigneeChange: () => {},
    onMilestoneChange: () => {},
    onMilestoneSearch: async () => {},
    onAddComment: () => {},
    onEditComment: () => {},
    onDeleteComment: () => {},
    onDelete: async () => {},

    // These are required but not used in read-only mode
    assigneePersonSearch: { search: async () => [], isLoading: false, results: [] },
    milestones: [],
    richTextHandlers: {} as any,
    subscriptions: { canSubscribe: false, isSubscribed: false },

    // Project info (required for layout)
    projectName: task.project?.name || "",
    projectLink: paths.projectPath(task.project?.id || ""),
    projectStatus: task.project?.status || "",
    workmapLink: paths.spaceWorkMapPath(task.space?.id || "", "projects"),
    space: task.space ? { id: task.space.id, name: task.space.name, link: paths.spacePath(task.space.id) } : null,
    childrenCount: { tasksCount: 0, discussionsCount: 0, checkInsCount: 0 },
    updateProjectName: async () => false,
  };
}
