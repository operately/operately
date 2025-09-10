import * as React from "react";
import { useNavigate } from "react-router-dom";
import Api from "@/api";

import * as Time from "@/utils/time";
import * as People from "@/models/people";
import * as Milestones from "@/models/milestones";
import * as Tasks from "@/models/tasks";
import * as Projects from "@/models/projects";
import * as Activities from "@/models/activities";
import { parseActivitiesForTurboUi, SUPPORTED_ACTIVITY_TYPES } from "@/models/activities/feed";

import { showErrorToast, MilestonePage, CommentSection } from "turboui";
import { Paths, usePaths } from "@/routes/paths";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { useMe, useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";
import { assertPresent } from "@/utils/assertions";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { PageModule } from "@/routes/types";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";
import { projectPageCacheKey } from "../ProjectV2Page";
import { useComments } from "./useComments";
import { usePersonFieldContributorsSearch } from "@/models/projectContributors";

export default { name: "MilestoneV2Page", loader, Page } as PageModule;

type TurboUiComment = CommentSection.Comment | CommentSection.MilestoneActivity;

type LoaderResult = {
  data: {
    milestone: Milestones.Milestone;
    tasks: Tasks.Task[];
    childrenCount: Projects.ProjectChildrenCount;
    activities: Activities.Activity[];
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        milestone: Milestones.getMilestone({
          id: params.id,
          includeProject: true,
          includeCreator: true,
          includeSpace: true,
          includePermissions: true,
          includeComments: true,
        }).then((d) => d.milestone),
        tasks: Api.project_milestones.listTasks({ milestoneId: params.id }).then((d) => d.tasks),
        childrenCount: Api.projects.countChildren({ id: params.id, useMilestoneId: true }).then((d) => d.childrenCount),
        activities: Api.getActivities({
          scopeId: params.id,
          scopeType: "milestone",
          actions: SUPPORTED_ACTIVITY_TYPES,
        }).then((d) => d.activities!),
      }),
  });
}

export function pageCacheKey(id: string): string {
  return `v11-MilestoneV2Page.task-${id}`;
}

function Page() {
  const paths = usePaths();
  const currentUser = useMe();
  const navigate = useNavigate();

  const pageData = PageCache.useData(loader);
  const { data, refresh } = pageData;
  const { milestone, childrenCount, activities } = data;

  assertPresent(milestone.project, "Milestone must have a project");
  assertPresent(milestone.space, "Milestone must have a space");
  assertPresent(milestone.permissions, "Milestone must have permissions");

  const workmapLink = paths.spaceWorkMapPath(milestone.space.id, "projects" as const);

  const [projectName, setProjectName] = usePageField(pageData, {
    value: ({ milestone }) => milestone.project?.name!,
    update: (v) => Api.editProjectName({ projectId: milestone.project?.id, name: v }),
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v?.trim() === "" ? "Project name cannot be empty" : null)],
  });

  const [description, setDescription] = usePageField(pageData, {
    value: ({ milestone }) => milestone.description && JSON.parse(milestone.description),
    update: (v) =>
      Api.project_milestones.updateDescription({ milestoneId: milestone.id, description: JSON.stringify(v) }),
    onError: () => showErrorToast("Error", "Failed to update milestone description."),
  });

  const [dueDate, setDueDate] = usePageField(pageData, {
    value: ({ milestone }) => parseContextualDate(milestone.timeframe?.contextualEndDate),
    update: (v) =>
      Api.project_milestones.updateDueDate({ milestoneId: milestone.id, dueDate: serializeContextualDate(v) }),
    onError: (e: string) => showErrorToast(e, "Failed to update milestone due date."),
  });

  const { parsedMilestone, milestones, setMilestones, title, setTitle } = useMilestones(pageData, milestone);

  const { tasks, createTask, updateTaskAssignee, updateTaskDueDate, updateTaskStatus, updateTaskMilestone } = Tasks.useTasksForTurboUi({
    backendTasks: data.tasks,
    projectId: milestone.project.id,
    cacheKey: pageCacheKey(milestone.id),
    milestones: milestones,
    setMilestones: setMilestones,
    refresh,
  });
  const { comments, setComments, handleCreateComment } = useComments(paths, milestone);
  const [status, setStatus] = useStatusField(paths, pageData, setComments);

  const timelineItems = React.useMemo(
    () => prepareTimelineItems(paths, activities, comments),
    [paths, activities, comments],
  );

  const handleDelete = React.useCallback(async () => {
    await Api.project_milestones.delete({ milestoneId: milestone.id });

    if (milestone.project) {
      PageCache.invalidate(projectPageCacheKey(milestone.project.id));
      navigate(paths.projectPath(milestone.project.id));
    } else {
      navigate(paths.homePath());
    }
  }, [milestone.id]);

  const mentionedPeopleSearch = People.useMentionedPersonSearch({
    scope: { type: "project", id: milestone.project.id },
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });

  const mentionedPersonLookup = useMentionedPersonLookupFn();

  const assigneeSearch = usePersonFieldContributorsSearch({
    projectId: milestone.project.id,
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });

  const props: MilestonePage.Props = {
    workmapLink,
    space: parseSpaceForTurboUI(paths, milestone.space),
    childrenCount,

    canEdit: Boolean(milestone.permissions.canEditTimeline),

    searchPeople: assigneeSearch,

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
    onEditComment: () => Promise.resolve(),
    canComment: Boolean(milestone.permissions.canComment),

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
    onTaskCreate: createTask,
    onTaskReorder: updateTaskMilestone,
    onTaskStatusChange: updateTaskStatus,
    onTaskAssigneeChange: updateTaskAssignee,
    onTaskDueDateChange: updateTaskDueDate,

    // Metadata
    createdBy: People.parsePersonForTurboUi(paths, milestone.creator),
    createdAt: Time.parseDate(milestone.insertedAt)!,

    // Rich text editor support
    mentionedPersonLookup,
    mentionedPeopleSearch,
  };

  return <MilestonePage key={milestone.id!} {...props} />;
}

function usePageField<T>(
  pageData: LoaderResult & { refresh?: () => Promise<void> },
  {
    value,
    update,
    onError,
    validations,
  }: {
    value: (data: { milestone: Milestones.Milestone }) => T;
    update: (value: T) => Promise<any>;
    onError?: (error: string) => void;
    validations?: ((value: T) => string | null)[];
  },
): [T, (v: T) => Promise<boolean>] {
  const { cacheVersion, data, refresh: refreshPageData } = pageData;

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion, data]);

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

    try {
      setState(newVal);
      await update(newVal);

      // Invalidate the cache for this entity
      if (data.milestone.id) {
        PageCache.invalidate(pageCacheKey(data.milestone.id));
      }

      // Refresh the page data if requested
      if (refreshPageData) {
        await refreshPageData();
      }

      return true;
    } catch (e) {
      setState(value(data));
      onError?.(e instanceof Error ? e.message : String(e));
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
  pageData: LoaderResult,
  setComments: React.Dispatch<React.SetStateAction<TurboUiComment[]>>,
) {
  const me = useMe()!;

  const { data } = pageData;
  const milestone = data.milestone;

  const [status, setStatus] = usePageField(pageData, {
    value: ({ milestone }) => milestone.status,
    update: async (v) => {
      const tmpId = `temp-${Date.now()}`;
      const optimisticComment: Milestones.MilestoneComment = {
        action: v === "done" ? "complete" : "reopen",
        comment: {
          id: tmpId,
          insertedAt: new Date().toISOString(),
          author: me,
        },
      };

      setComments((prev) => [...prev, Milestones.parseMilestoneCommentForTurboUi(paths, optimisticComment)]);

      const res = await Api.postMilestoneComment({
        milestoneId: milestone.id,
        content: null,
        action: v === "done" ? "complete" : "reopen",
      });

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === tmpId) {
            const comment = { ...res.comment.comment, author: me };
            return Milestones.parseMilestoneCommentForTurboUi(paths, { ...res.comment, comment });
          } else {
            return c;
          }
        }),
      );
    },
    onError: (e: string) => showErrorToast(e, "Failed to update milestone status."),
  });

  return [status, setStatus] as const;
}

function useMilestones(pageData, milestone: Milestones.Milestone) {
  const paths = usePaths();
  const [milestones, setMilestones] = React.useState<MilestonePage.Milestone[]>(
    Milestones.parseMilestonesForTurboUi(paths, [milestone]),
  );

  const parsedMilestone = milestones[0]!;

  const [title, setTitle] = usePageField(pageData, {
    value: ({ milestone }) => milestone.title,
    update: (v) => Api.project_milestones.updateTitle({ milestoneId: milestone.id, title: v }),
    onError: (e: string) => showErrorToast(e, "Failed to update milestone name."),
    validations: [(v) => (v.trim() === "" ? "Milestone name cannot be empty" : null)],
  });

  return { 
    title,
    setTitle,
    parsedMilestone,
    milestones, 
    setMilestones, 
  };
}