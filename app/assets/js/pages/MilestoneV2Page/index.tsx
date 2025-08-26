import * as React from "react";
import Api from "@/api";

import * as People from "@/models/people";
import * as Milestones from "@/models/milestones";

import { showErrorToast, MilestonePage } from "turboui";
import { Paths, usePaths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { assertPresent } from "@/utils/assertions";
import { parseSpaceForTurboUI } from "@/models/spaces";
import { PageModule } from "@/routes/types";

export default { name: "MilestoneV2Page", loader, Page } as PageModule;

type LoaderResult = {
  data: {
    milestone: Milestones.Milestone;
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureNotEnabled(params, { feature: "milestone_v2", path: paths.projectMilestonePath(params.id) });

  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        milestone: Milestones.getMilestone({
          id: params.id,
          includeProject: true,
          includeSpace: true,
          includePermissions: true,
        }).then((d) => d.milestone),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v4-MilestoneV2Page.task-${id}`;
}

function Page() {
  const paths = usePaths();
  const currentUser = useMe();

  const pageData = PageCache.useData(loader);
  const { data } = pageData;
  const { milestone } = data;

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

  const [_name, setName] = usePageField(pageData, {
    value: ({ milestone }) => milestone.title,
    update: () => Promise.resolve(), // Placeholder for API call
    onError: (e: string) => showErrorToast(e, "Failed to update milestone name."),
    validations: [(v) => (v.trim() === "" ? "Milestone name cannot be empty" : null)],
  });

  const [description, setDescription] = usePageField(pageData, {
    value: ({ milestone }) => milestone.description && JSON.parse(milestone.description),
    update: () => Promise.resolve(), // Placeholder for API call
    onError: () => showErrorToast("Error", "Failed to update milestone description."),
  });

  const mentionedPeopleSearch = People.useMentionedPersonSearch({
    scope: { type: "project", id: milestone.project.id },
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });

  const props: MilestonePage.Props = {
    workmapLink,
    tasksCount: 0,
    space: parseSpaceForTurboUI(paths, milestone.space),

    canEdit: Boolean(milestone.permissions.canEditTimeline),

    searchPeople: mentionedPeopleSearch,

    // Project
    projectName,
    projectLink: paths.projectV2Path(milestone.project.id),
    projectStatus: milestone.project.status,
    updateProjectName: setProjectName,

    // Milestone data
    milestone: Milestones.parseMilestoneForTurboUi(paths, milestone),
    tasks: [],

    // Timeline/Comments
    currentUser: People.parsePersonForTurboUi(paths, currentUser)!,
    timelineItems: [],
    onAddComment: () => Promise.resolve(),
    onEditComment: () => Promise.resolve(),
    canComment: Boolean(milestone.permissions.canComment),

    // Core milestone data
    onMilestoneNameChange: setName,
    description,
    onDescriptionChange: setDescription,
    onDueDateChange: () => Promise.resolve(),

    // Task operations
    onTaskCreate: () => Promise.resolve(),
    onTaskReorder: () => {},
    onTaskStatusChange: () => {},
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},

    // Metadata
    createdAt: new Date(milestone.insertedAt || Date.now()),
    createdBy: undefined,

    // Actions
    onDelete: () => {},
    onArchive: () => {},
    onCopyUrl: () => {},

    // Subscription
    isSubscribed: false,
    onSubscriptionToggle: () => {},

    // Rich text editor support
    peopleSearch: mentionedPeopleSearch,
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
