import React, { useCallback, useMemo } from "react";
import Api from "@/api";

import { useNavigate } from "react-router-dom";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import * as Activities from "@/models/activities";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { parseMilestoneForTurboUi, parseMilestonesForTurboUi } from "@/models/milestones";
import { parseActivitiesForTurboUi, SUPPORTED_ACTIVITY_TYPES } from "@/models/activities/tasks";
import * as Time from "@/utils/time";

import { Paths, usePaths } from "../../routes/paths";
import { showErrorToast, TaskPage } from "turboui";
import { PageModule } from "../../routes/types";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";
import { usePersonFieldContributorsSearch } from "@/models/projectContributors";
import { projectPageCacheKey } from "../ProjectV2Page";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { useMe } from "@/contexts/CurrentCompanyContext";

type LoaderResult = {
  data: {
    task: Tasks.Task;
    tasksCount: number;
    activities: Activities.Activity[];
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureNotEnabled(params, { feature: "task_v2", path: paths.taskPath(params.id) });

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
        }).then((d) => d.task!),
        tasksCount: Api.project_tasks.getOpenTaskCount({ id: params.id, useTaskId: true }).then((d) => d.count!),
        activities: Api.getActivities({
          scopeId: params.id,
          scopeType: "task",
          actions: SUPPORTED_ACTIVITY_TYPES,
        }).then((d) => d.activities!),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v5-TaskV2Page.task-${id}`;
}

export default { name: "TaskV2Page", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const currentUser = useMe();

  const pageData = PageCache.useData(loader);
  const { data, refresh: refreshPageData } = pageData;
  const { task, tasksCount, activities } = data;

  assertPresent(task.project, "Task must have a project");
  assertPresent(task.space, "Task must have a space");

  const workmapLink = paths.spaceWorkMapPath(task.space.id, "projects" as const);

  const [projectName, setProjectName] = usePageField({
    value: ({ task }) => task.project!.name,
    update: (v) => Api.editProjectName({ projectId: task.project!.id, name: v }),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v.trim() === "" ? "Project name cannot be empty" : null)],
    refreshPageData,
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

  const timelineItems = useMemo(() => prepareTimelineItems(paths, activities), [paths, activities]);

  const handleDelete = async () => {
    try {
      await Api.project_tasks.delete({ taskId: task.id });

      if (task.project) {
        PageCache.invalidate(projectPageCacheKey(task.project.id));
        navigate(paths.projectPath(task.project.id));
      } else {
        navigate(paths.homePath());
      }
    } catch (error) {
      showErrorToast("Error", "Failed to delete task.");
    }
  };

  const handleAddComment = useCallback(
    async (content: any) => {
      try {
        await Api.createComment({ entityId: task.id, entityType: "project_task", content: JSON.stringify(content) });

        if (refreshPageData) {
          refreshPageData();
        }
      } catch (error) {
        showErrorToast("Error", "Failed to add comment.");
      }
    },
    [refreshPageData, task.id]
  );

  const assigneeSearch = usePersonFieldContributorsSearch({
    projectId: task.project.id,
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });
  const searchMilestones = useMilestonesSearch(task.project.id);

  // Prepare TaskPage props
  const props: TaskPage.Props = {
    projectName,
    projectLink: paths.projectV2Path(task.project.id),
    projectStatus: task.project.status,
    workmapLink,
    tasksCount,
    space: parseSpaceForTurboUI(paths, task.space),

    searchPeople: assigneeSearch,
    updateProjectName: setProjectName,

    // Timeline/Comments
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
    timelineItems,
    onAddComment: handleAddComment,
    canComment: true,

    // Milestone selection
    milestone: milestone as TaskPage.Milestone | null,
    onMilestoneChange: setMilestone,
    searchMilestones,

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

    // Placeholder for person lookup functionality
    peopleSearch: () => Promise.resolve([]),
    mentionedPersonLookup: () => Promise.resolve(null),

    // Permissions - simplified placeholder
    canEdit: true,
  };

  return <TaskPage key={task.id!} {...props} />;
}

interface usePageFieldProps<T> {
  value: (data: { task: Tasks.Task; tasksCount: number; activities: Activities.Activity[] }) => T;
  update: (newValue: T) => Promise<any>;
  onError?: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
  refreshPageData?: () => Promise<void>;
}

function usePageField<T>({
  value,
  update,
  onError,
  validations,
  refreshPageData,
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

    const successHandler = () => {
      // Invalidate the cache and refresh the data
      PageCache.invalidate(pageCacheKey(data.task.id!));
      if (refreshPageData) {
        refreshPageData();
      }
    };

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
          successHandler();
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

function useMilestonesSearch(projectId): TaskPage.Props["searchMilestones"] {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<TaskPage.Milestone[]> => {
    const data = await Api.projects.getMilestones({ projectId: projectId, query: query.trim() });

    return parseMilestonesForTurboUi(paths, data.milestones || []);
  };
}

function prepareTimelineItems(paths: Paths, activities: Activities.Activity[]) {
  const parsedActivities = parseActivitiesForTurboUi(paths, activities);

  return parsedActivities.map((activity) => ({
    type: "task-activity",
    value: activity,
  })) as TaskPage.TimelineItemType[];
}
