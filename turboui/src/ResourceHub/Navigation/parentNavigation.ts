import type { ResourceHub, ResourceHubFolder, ResourceHubNavigationPaths } from "../types";

export interface NavigationItem {
  to: string;
  label: string;
}

export function resourceHubParentNavigationItem(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem | null {
  if (hasProjectParent(resourceHub)) {
    return {
      to: paths.projectOverviewPath(resourceHub.project.id),
      label: resourceHub.project.name ?? "",
    };
  }

  if (hasGoalParent(resourceHub)) {
    return {
      to: paths.goalOverviewPath(resourceHub.goal.id),
      label: resourceHub.goal.name ?? "",
    };
  }

  if (resourceHub.space?.id) {
    return {
      to: paths.spacePath(resourceHub.space.id),
      label: resourceHub.space.name ?? "",
    };
  }

  return null;
}

export function resourceHubPageNavigation(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] {
  const projectNavigation = resourceHubProjectNavigation(resourceHub, paths);
  if (projectNavigation) return projectNavigation;

  const goalNavigation = resourceHubGoalNavigation(resourceHub, paths);
  if (goalNavigation) return goalNavigation;

  const parentItem = resourceHubParentNavigationItem(resourceHub, paths);

  return parentItem ? [parentItem] : [];
}

export function resourceHubDraftsNavigation(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] {
  return resourceHubBaseNavigation(resourceHub, paths);
}

export function resourceHubFolderNavigation(
  folder: ResourceHubFolder,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] {
  if (!folder.resourceHub) {
    return [];
  }

  return resourceHubBaseNavigation(folder.resourceHub, paths).concat(
    (folder.pathToFolder ?? []).map((item) => ({
      to: paths.resourceHubFolderPath(item.id),
      label: item.name ?? "",
    })),
  );
}

function resourceHubBaseNavigation(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] {
  const projectNavigation = resourceHubProjectNavigation(resourceHub, paths);
  if (projectNavigation) return projectNavigation;

  const goalNavigation = resourceHubGoalNavigation(resourceHub, paths);
  if (goalNavigation) return goalNavigation;

  const items = resourceHubPageNavigation(resourceHub, paths);
  const resourceHubItem = resourceHubNavigationItem(resourceHub, paths);

  if (resourceHubItem) items.push(resourceHubItem);

  return items;
}

function resourceHubProjectNavigation(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] | null {
  if (!hasProjectParent(resourceHub)) return null;

  return [
    { to: paths.spacePath(resourceHub.space.id), label: resourceHub.space.name ?? "" },
    { to: paths.projectWorkMapPath(resourceHub.space.id), label: "Work Map" },
    { to: paths.projectOverviewPath(resourceHub.project.id), label: resourceHub.project.name ?? "" },
    { to: paths.projectDocsAndFilesPath(resourceHub.project.id), label: "Docs & Files" },
  ];
}

function resourceHubGoalNavigation(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem[] | null {
  if (!hasGoalParent(resourceHub)) return null;

  return [
    { to: paths.spacePath(resourceHub.space.id), label: resourceHub.space.name ?? "" },
    { to: paths.goalWorkMapPath(resourceHub.space.id), label: "Work Map" },
    { to: paths.goalOverviewPath(resourceHub.goal.id), label: resourceHub.goal.name ?? "" },
    { to: paths.goalDocsAndFilesPath(resourceHub.goal.id), label: "Docs & Files" },
  ];
}

function resourceHubNavigationItem(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem | null {
  if (!resourceHub.id) return null;

  return {
    to: paths.resourceHubPath(resourceHub.id),
    label: resourceHub.name ?? "",
  };
}

function hasProjectParent(
  resourceHub: ResourceHub,
): resourceHub is ResourceHub & {
  space: { id: string; name: string };
  project: { id: string; name: string };
} {
  return Boolean(
    resourceHub.space?.id && resourceHub.space?.name && resourceHub.project?.id && resourceHub.project?.name,
  );
}

function hasGoalParent(
  resourceHub: ResourceHub,
): resourceHub is ResourceHub & {
  space: { id: string; name: string };
  goal: { id: string; name: string };
} {
  return Boolean(
    resourceHub.space?.id && resourceHub.space?.name && resourceHub.goal?.id && resourceHub.goal?.name,
  );
}
