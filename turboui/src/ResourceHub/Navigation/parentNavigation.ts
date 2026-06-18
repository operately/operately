import type { ResourceHub, ResourceHubFolder, ResourceHubNavigationPaths } from "../types";

export interface NavigationItem {
  to: string;
  label: string;
}

export function resourceHubParentNavigationItem(
  resourceHub: ResourceHub,
  paths: ResourceHubNavigationPaths,
): NavigationItem | null {
  if (resourceHub.project?.id) {
    return {
      to: paths.projectPath(resourceHub.project.id),
      label: resourceHub.project.name ?? "",
    };
  }

  if (resourceHub.goal?.id) {
    return {
      to: paths.goalPath(resourceHub.goal.id),
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
  const items = resourceHubPageNavigation(resourceHub, paths);

  if (resourceHub.id) {
    items.push({
      to: paths.resourceHubPath(resourceHub.id),
      label: resourceHub.name ?? "",
    });
  }

  return items;
}
