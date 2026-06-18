import type { Comment, Goal, Project, ResourceHub, ResourceHubFolder, Space } from "@/api";
import type { Paths } from "@/routes/paths";
import { commentPath, goalDocsAndFilesLink, projectLink, spaceLink } from "./feedItemLinks";

type ParentData = {
  goal?: Goal | null;
  project?: Project | null;
  space?: Space | null;
};

type ScopeData = ParentData & {
  resourceHub?: ResourceHub | null;
};

type ParentDescriptor = {
  link: JSX.Element;
  label: "goal" | "project" | "space";
  page: "goal" | "project" | "space";
};

export function resourceHubParentParts(page: string, data: ParentData): Array<string | JSX.Element> {
  const parent = visibleParentDescriptor(page, data);

  if (!parent) return [];

  return ["in the", parent.link, parent.label];
}

function resourceHubParentDescriptor(data: ParentData): ParentDescriptor | null {
  if (data.project) {
    return {
      link: projectLink(data.project),
      label: "project",
      page: "project",
    };
  }

  if (data.goal) {
    return {
      link: goalDocsAndFilesLink(data.goal),
      label: "goal",
      page: "goal",
    };
  }

  if (data.space) {
    return {
      link: spaceLink(data.space),
      label: "space",
      page: "space",
    };
  }

  return null;
}

export function visibleParentDescriptor(page: string, data: ParentData): ParentDescriptor | null {
  const parent = resourceHubParentDescriptor(data);

  if (!parent) return null;
  if (page === parent.page) return null;

  return parent;
}

function resourceHubParentPath(paths: Paths, data: ParentData): string {
  if (data.project?.id) return paths.projectPath(data.project.id);
  if (data.goal?.id) return paths.goalPath(data.goal.id, { tab: "docs-and-files" });
  if (data.space?.id) return paths.spacePath(data.space.id);

  return paths.homePath();
}

export function resourceHubPathOrParent(paths: Paths, data: ScopeData): string {
  if (data.resourceHub?.id) return paths.resourceHubPath(data.resourceHub.id);

  return resourceHubParentPath(paths, data);
}

export function resourceHubFolderPathOrParent(paths: Paths, folder: ResourceHubFolder | null | undefined, data: ScopeData): string {
  if (folder?.id) return paths.resourceHubFolderPath(folder.id);

  return resourceHubPathOrParent(paths, data);
}

export function commentedResourcePath(
  paths: Paths,
  data: ScopeData,
  resourcePath: string | null,
  comment?: Pick<Comment, "id"> | null,
): string {
  if (resourcePath) return commentPath(resourcePath, comment);

  return resourceHubPathOrParent(paths, data);
}

export function resourceHubLocationName(data: ScopeData): string | null {
  return data.resourceHub?.name ?? data.project?.name ?? data.goal?.name ?? data.space?.name ?? null;
}
