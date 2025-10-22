import React, { useMemo, useCallback } from "react";
import Api from "@/api";

import { useNavigate } from "react-router-dom";
import * as Tasks from "@/models/tasks";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";
import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { parseMilestoneForTurboUi } from "@/models/milestones";
import { parseActivitiesForTurboUi, SUPPORTED_ACTIVITY_TYPES } from "@/models/activities/feed";
import * as Time from "@/utils/time";

import { Paths, usePaths } from "../../routes/paths";
import { showErrorToast, TaskPage } from "turboui";
import { PageModule } from "../../routes/types";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { projectPageCacheKey } from "../ProjectPage";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useComments } from "./useComments";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useMilestones } from "@/models/milestones/useMilestones";

type LoaderResult = {
  data: {
    task: Tasks.Task;
    childrenCount: Projects.ProjectChildrenCount;
    activities: Activities.Activity[];
    comments: Comments.Comment[];
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        task: Tasks.getTask({
          id: params.id,
          includeProject: true,
          includeMilestone: true,
          includeAssignees: true,
          includeCreator: true,
          includeSpace: true,
          includePermissions: true,
        }).then((d) => d.task!),
        childrenCount: Api.projects.countChildren({ id: params.id, useTaskId: true }).then((d) => d.childrenCount),
        activities: Api.getActivities({
          scopeId: params.id,
          scopeType: "task",
          actions: SUPPORTED_ACTIVITY_TYPES,
        }).then((d) => d.activities!),
        comments: Api.getComments({
          entityId: params.id,
          entityType: "project_task",
        }).then((d) => d.comments!),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v7-TaskV2Page.task-${id}`;
}

export default { name: "TaskV2Page", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const currentUser = useMe();

  const pageData = PageCache.useData(loader);
  const { data, refresh: refreshPageData } = pageData;
  const { task, childrenCount, activities } = data;

  assertPresent(task.project, "Task must have a project");
  assertPresent(task.space, "Task must have a space");
  assertPresent(task.permissions, "Task must have permissions");

  const workmapLink = paths.spaceWorkMapPath(task.space.id, "projects" as const);

  const [projectName, setProjectName] = usePageField({
    value: ({ task }) => task.project!.name,
    update: (v) => Api.editProjectName({ projectId: task.project!.id, name: v }),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Project name cannot be empty" : null)],
    refreshPageData,
    clearProjectCache: true,
  });

  const [name, setName] = usePageField({
    value: ({ task }) => task.name,
    update: (v) => Api.project_tasks.updateName({ taskId: task.id!, name: v }),
    onError: (e: string) => showErrorToast(e, "Failed to update task name."),
    validations: [(v) => (v.trim() === "" ? "Task name cannot be empty" : null)],
    refreshPageData,
  });

  const [description, setDescription] = usePageField({
    value: ({ task }) => task.description && JSON.parse(task.description),
    update: (v) => Api.project_tasks.updateDescription({ taskId: task.id!, description: JSON.stringify(v) }),
    onError: () => showErrorToast("Error", "Failed to update task description."),
    refreshPageData,
  });

  const [status, setStatus] = usePageField({
    value: ({ task }) => Tasks.parseTaskForTurboUi(paths, task).status,
    update: (v) => Api.project_tasks.updateStatus({ taskId: task.id!, status: v }),
    onError: () => showErrorToast("Error", "Failed to update task status."),
    refreshPageData,
  });

  const [dueDate, setDueDate] = usePageField({
    value: ({ task }) => parseContextualDate(task.dueDate),
    update: (v) => Api.project_tasks.updateDueDate({ taskId: task.id!, dueDate: serializeContextualDate(v) }),
    onError: () => showErrorToast("Error", "Failed to update due date."),
    refreshPageData,
  });

  const [assignee, setAssignee] = usePageField({
    value: ({ task }) => People.parsePersonForTurboUi(paths, task.assignees?.[0] || null),
    update: (v) => Api.project_tasks.updateAssignee({ taskId: task.id, assigneeId: v?.id ?? null }),
    onError: () => showErrorToast("Error", "Failed to update assignees."),
    refreshPageData,
  });

  const [milestone, setMilestone] = usePageField({
    value: ({ task }) => (task.milestone ? parseMilestoneForTurboUi(paths, task.milestone) : null),
    update: (v) => Api.project_tasks.updateMilestone({ taskId: task.id, milestoneId: v?.id ?? null }),
    onError: () => showErrorToast("Error", "Failed to update milestone."),
    refreshPageData,
  });

  const { comments, handleAddComment, handleEditComment } = useComments(task, data.comments, () => {
    PageCache.invalidate(pageCacheKey(task.id));
  });

  const timelineItems = useMemo(() => prepareTimelineItems(paths, activities, comments), [paths, activities, comments]);

  const handleDelete = async () => {
    try {
      await Api.project_tasks.delete({ taskId: task.id });

      if (task.project) {
        PageCache.invalidate(projectPageCacheKey(task.project.id));
        navigate(paths.projectPath(task.project.id, "tasks"));
      } else {
        navigate(paths.homePath());
      }
    } catch (error) {
      showErrorToast("Error", "Failed to delete task.");
    }
  };

  // Transform function must be memoized to prevent infinite loop in the hook
  const transformPerson = useCallback(
    (p) => People.parsePersonForTurboUi(paths, p)!,
    [paths]
  );

  const assigneeSearchData = People.usePersonFieldSpaceMembersSearch({
    spaceId: task.space.id,
    transformResult: transformPerson,
  });
  const { milestones, search: searchMilestones } = useMilestones(task.project.id);
  const richEditorHandlers = useRichEditorHandlers({ scope: { type: "project", id: task.project.id } });

  const props: TaskPage.Props = {
    projectName,
    projectLink: paths.projectPath(task.project.id),
    projectStatus: task.project.status,
    workmapLink,
    space: parseSpaceForTurboUI(paths, task.space),
    childrenCount,

    canEdit: Boolean(task.permissions.canEditTimeline),

    assigneeSearchData,
    updateProjectName: setProjectName,

    // Timeline/Comments
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
    timelineItems,
    onAddComment: handleAddComment,
    onEditComment: handleEditComment,
    canComment: Boolean(task.permissions.canComment),

    // Milestone selection
    milestone: milestone as TaskPage.Milestone | null,
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
    dueDate: dueDate || undefined,
    onDueDateChange: setDueDate,
    assignee,
    onAssigneeChange: setAssignee,

    onDelete: handleDelete,

    // Metadata
    createdAt: new Date(task.insertedAt || Date.now()),
    createdBy: People.parsePersonForTurboUi(paths, task.creator) as TaskPage.Person,
    closedAt: Time.parse(task.project.closedAt),

    // Subscription
    isSubscribed: false,
    onSubscriptionToggle: () => {},

    richTextHandlers: richEditorHandlers,
  };

  return <TaskPage key={task.id!} {...props} />;
}

interface usePageFieldProps<T> {
  value: (data: {
    task: Tasks.Task;
    childrenCount: { tasksCount: number; discussionsCount: number };
    activities: Activities.Activity[];
  }) => T;
  update: (newValue: T) => Promise<any>;
  onError: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
  refreshPageData?: () => Promise<void>;
  clearProjectCache?: boolean;
}

function usePageField<T>({
  value,
  update,
  onError,
  validations,
  refreshPageData,
  clearProjectCache,
}: usePageFieldProps<T>): [T, (v: T) => Promise<boolean>] {
  const pageData = PageCache.useData(loader);
  const { cacheVersion, data } = pageData;

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

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

    const oldVal = state;

    const errorHandler = (error: any) => {
      setState(oldVal);
      onError?.(error);
    };

    setState(newVal);

    return update(newVal)
      .then((res) => {
        if (res === false || (typeof res === "object" && res?.success === false)) {
          errorHandler("Update failed");
          return false;
        } else {
          // Invalidate the cache and refresh the data
          PageCache.invalidate(pageCacheKey(data.task.id!));

          if (refreshPageData) {
            refreshPageData();
          }

          if (clearProjectCache && data.task.project?.id) {
            PageCache.invalidate(projectPageCacheKey(data.task.project.id));
          }
          return true;
        }
      })
      .catch((err) => {
        errorHandler(err);
        return false;
      });
  };

  return [state, updateState];
}


function prepareTimelineItems(paths: Paths, activities: Activities.Activity[], comments: Comments.Comment[]) {
  const parsedActivities = parseActivitiesForTurboUi(paths, activities, "task").map((activity) => ({
    type: "task-activity",
    value: activity,
  }));
  const parsedComments = Comments.parseCommentsForTurboUi(paths, comments).map((comment) => ({
    type: "comment",
    value: comment,
  }));

  const timelineItems = [...parsedActivities, ...parsedComments] as TaskPage.TimelineItemType[];

  timelineItems.sort((a, b) => {
    // Special handling for temporary comments - always show them last
    const aIsTemp = a.value.id.startsWith("temp-");
    const bIsTemp = b.value.id.startsWith("temp-");

    // If one is temporary and the other isn't, prioritize the non-temporary one
    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;

    // Otherwise use standard date comparison
    const aInsertedAt = a.type === "acknowledgment" ? a.insertedAt : a.value.insertedAt;
    const bInsertedAt = b.type === "acknowledgment" ? b.insertedAt : b.value.insertedAt;

    return aInsertedAt.localeCompare(bInsertedAt);
  });

  return timelineItems;
}
