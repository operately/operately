import type { Paths } from "@/routes/paths";
import type { Goal, Project, ResourceHub, Space } from "@/api";
import type { ResourceHubNavigationPaths, ResourceHubNodesListPaths } from "turboui";

// Bind Paths methods so they can be passed as callbacks without losing `this`.
export function resourceHubNavigationPaths(paths: Paths): ResourceHubNavigationPaths {
  return {
    projectOverviewPath: (id) => paths.projectPath(id, { tab: "overview" }),
    projectDocsAndFilesPath: (id) => paths.projectPath(id, { tab: "docs-and-files" }),
    goalOverviewPath: (id) => paths.goalPath(id, { tab: "overview" }),
    goalDocsAndFilesPath: (id) => paths.goalPath(id, { tab: "docs-and-files" }),
    spacePath: (id) => paths.spacePath(id),
    projectWorkMapPath: (spaceId) => paths.spaceWorkMapPath(spaceId, "projects"),
    goalWorkMapPath: (spaceId) => paths.spaceWorkMapPath(spaceId),
    resourceHubPath: (id) => paths.resourceHubPath(id),
    resourceHubFolderPath: (id) => paths.resourceHubFolderPath(id),
  };
}

type ResourceHubLandingTarget = {
  id?: string | null;
  resourceHubId?: string | null;
  resourceHub?: Pick<ResourceHub, "id"> | null;
  project?: Pick<Project, "id"> | null;
  goal?: Pick<Goal, "id"> | null;
};

export function resourceHubLandingPath(
  paths: Paths,
  resourceHub?: ResourceHubLandingTarget | null,
) {
  if (resourceHub?.project?.id) {
    return paths.projectPath(resourceHub.project.id, { tab: "docs-and-files" });
  }

  if (resourceHub?.goal?.id) {
    return paths.goalPath(resourceHub.goal.id, { tab: "docs-and-files" });
  }

  if (resourceHub?.resourceHub?.id) {
    return paths.resourceHubPath(resourceHub.resourceHub.id);
  }

  if (resourceHub?.resourceHubId) {
    return paths.resourceHubPath(resourceHub.resourceHubId);
  }

  if (resourceHub?.id) {
    return paths.resourceHubPath(resourceHub.id);
  }

  return paths.homePath();
}

export function resourceHubWithParentContext<T extends ResourceHub | null | undefined>(
  resourceHub: T,
  opts?: {
    space?: Space | null;
    project?: Project | null;
    goal?: Goal | null;
  },
) : T {
  if (!resourceHub) return resourceHub;

  return {
    ...resourceHub,
    space:
      resourceHub.space ??
      opts?.space ??
      opts?.project?.space ??
      opts?.goal?.space ??
      resourceHub.project?.space ??
      resourceHub.goal?.space ??
      null,
    project: resourceHub.project ?? opts?.project ?? null,
    goal: resourceHub.goal ?? opts?.goal ?? null,
  } as T;
}

export function resourceHubListPaths(paths: Paths): ResourceHubNodesListPaths {
  return {
    editDocumentPath: (id) => paths.resourceHubEditDocumentPath(id),
    editFilePath: (id) => paths.resourceHubEditFilePath(id),
    editLinkPath: (id) => paths.resourceHubEditLinkPath(id),
    documentPath: (id) => paths.resourceHubDocumentPath(id),
    folderPath: (id) => paths.resourceHubFolderPath(id),
  };
}
