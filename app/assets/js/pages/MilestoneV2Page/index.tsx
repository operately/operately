import * as React from "react";

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
import { usePageField } from "@/hooks";
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
        milestone: Milestones.getMilestone({ id: params.id }).then((d) => d.milestone),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v1-MilestoneV2Page.task-${id}`;
}

export function Page() {
  const paths = usePaths();
  const currentUser = useMe();

  const pageData = PageCache.useData(loader);
  const { data, refresh: refreshPageData } = pageData;
  const { milestone } = data;

  assertPresent(milestone.project, "Milestone must have a project");
  assertPresent(milestone.space, "Milestone must have a space");
  assertPresent(milestone.permissions, "Milestone must have permissions");

  const workmapLink = paths.spaceWorkMapPath(milestone.space.id, "projects" as const);

  const [projectName, _] = usePageField({
    value: ({ milestone }) => milestone.project?.name!,
    update: () => Promise.resolve(), // Placeholder for API call
    onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
    validations: [(v) => (v?.trim() === "" ? "Project name cannot be empty" : null)],
    pageData,
    pageCacheKey,
    entityId: milestone.project.id,
    refreshPageData,
  });

  const [_name, setName] = usePageField({
    value: ({ milestone }) => milestone.title,
    update: () => Promise.resolve(), // Placeholder for API call
    onError: (e: string) => showErrorToast(e, "Failed to update milestone name."),
    validations: [(v) => (v.trim() === "" ? "Milestone name cannot be empty" : null)],
    pageData,
    pageCacheKey,
    entityId: milestone.id,
    refreshPageData,
  });

  const [description, setDescription] = usePageField({
    value: ({ milestone }) => milestone.description && JSON.parse(milestone.description),
    update: () => Promise.resolve(), // Placeholder for API call
    onError: () => showErrorToast("Error", "Failed to update milestone description."),
    pageData,
    pageCacheKey,
    entityId: milestone.id,
    refreshPageData,
  });

  const mentionedPeopleSearch = People.useMentionedPersonSearch({
    scope: { type: "project", id: milestone.project.id },
    transformResult: (p) => People.parsePersonForTurboUi(paths, p)!,
  });

  const props: MilestonePage.Props = {
    projectName,
    projectLink: paths.projectV2Path(milestone.project.id),
    projectStatus: milestone.project.status,
    workmapLink,
    tasksCount: 0,
    space: parseSpaceForTurboUI(paths, milestone.space),

    canEdit: Boolean(milestone.permissions.canEditTimeline),

    searchPeople: mentionedPeopleSearch,

    // Milestone data
    milestone: Milestones.parseMilestoneForTurboUi(paths, milestone),
    tasks: [],
    milestones: [], // Other milestones in the project

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
