import * as Paper from "@/components/PaperContainer";
import { resourceHubNavigationPaths, resourceHubWithParentContext } from "@/models/resourceHubs";
import type { ResourceHub, ResourceHubDocument, ResourceHubFile, ResourceHubFolder, ResourceHubLink } from "@/models/resourceHubs";
import type { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { resourceHubDraftsNavigation, resourceHubFolderNavigation, resourceHubPageNavigation } from "turboui";

type ParentAwareResource<T> = T & { resourceHub: ResourceHub };

type ResourcePageInput = ResourceHubDocument | ResourceHubFile | ResourceHubFolder | ResourceHubLink;

type ResourcePageResource =
  | ParentAwareResource<ResourceHubDocument>
  | ParentAwareResource<ResourceHubFile>
  | ParentAwareResource<ResourceHubFolder>
  | ParentAwareResource<ResourceHubLink>;

export function buildParentAwareResourceHub<T extends ResourceHub | null | undefined>(
  resourceHub: T,
  opts?: {
    space?: ResourcePageInput["space"];
    project?: ResourcePageInput["project"];
    goal?: ResourcePageInput["goal"];
  },
) {
  return resourceHubWithParentContext(resourceHub, opts);
}

export function buildParentAwareResource<T extends ResourcePageInput>(resource: T): ParentAwareResource<T> {
  assertPresent(resource.resourceHub, "resourceHub must be present in resource");

  return {
    ...resource,
    resourceHub: buildParentAwareResourceHub(resource.resourceHub, {
      space: resource.space,
      project: resource.project,
      goal: resource.goal,
    }),
  };
}

export function buildResourcePageNavigationItems(resource: ResourcePageResource, paths: Paths): Paper.NavigationItem[] {
  const navigationPaths = resourceHubNavigationPaths(paths);

  return resourceHubDraftsNavigation(resource.resourceHub, navigationPaths).concat(
    getPathToResource(resource).map((folder) => ({
      to: navigationPaths.resourceHubFolderPath(folder.id!),
      label: folder.name ?? "",
    })),
  );
}

export function buildNewResourcePageNavigationItems(
  resourceHub: ResourceHub,
  folder: ResourceHubFolder | undefined,
  paths: Paths,
): Paper.NavigationItem[] {
  const navigationPaths = resourceHubNavigationPaths(paths);

  return resourceHubDraftsNavigation(resourceHub, navigationPaths).concat(
    (folder?.pathToFolder ?? []).map((item) => ({
      to: navigationPaths.resourceHubFolderPath(item.id!),
      label: item.name ?? "",
    })),
  );
}

export function buildFolderPageNavigationItems(folder: ResourceHubFolder, paths: Paths): Paper.NavigationItem[] {
  return resourceHubFolderNavigation(folder, resourceHubNavigationPaths(paths));
}

export function buildResourceHubPageNavigationItems(resourceHub: ResourceHub, paths: Paths): Paper.NavigationItem[] {
  return resourceHubPageNavigation(resourceHub, resourceHubNavigationPaths(paths));
}

export function buildDraftsPageNavigationItems(resourceHub: ResourceHub, paths: Paths): Paper.NavigationItem[] {
  return resourceHubDraftsNavigation(resourceHub, resourceHubNavigationPaths(paths));
}

function getPathToResource(resource: ResourcePageResource) {
  if ("pathToDocument" in resource) return resource.pathToDocument ?? [];
  if ("pathToLink" in resource) return resource.pathToLink ?? [];
  if ("pathToFile" in resource) return resource.pathToFile ?? [];
  if ("pathToFolder" in resource) return resource.pathToFolder ?? [];

  throw new Error("pathToDocument, pathToLink, pathToFolder or pathToFile must be included in the resource");
}
