import * as React from "react";

import { Navigation } from "../../Page/Navigation";
import { assertPresent } from "../../utils/assertions";
import type { ResourceHubBreadcrumbResource, ResourceHubNavigationPaths } from "../types";

interface ResourcePageNavigationProps {
  resource: ResourceHubBreadcrumbResource;
  paths: ResourceHubNavigationPaths;
  testId?: string;
}

export function ResourcePageNavigation({ resource, paths, testId = "navigation" }: ResourcePageNavigationProps) {
  const path = getPathToResource(resource);

  assertPresent(resource.resourceHub, "resourceHub must be present in resource");
  assertPresent(resource.resourceHub.space, "space must be present in resourceHub");

  const items = [
    { to: paths.spacePath(resource.resourceHub.space.id), label: resource.resourceHub.space.name ?? "" },
    { to: paths.resourceHubPath(resource.resourceHub.id), label: resource.resourceHub.name ?? "" },
    ...path.map((folder) => ({
      to: paths.resourceHubFolderPath(folder.id),
      label: folder.name ?? "",
    })),
  ];

  return <Navigation items={items} testId={testId} />;
}

function getPathToResource(resource: ResourceHubBreadcrumbResource) {
  if (resource.pathToDocument) return resource.pathToDocument;
  if (resource.pathToLink) return resource.pathToLink;
  if (resource.pathToFile) return resource.pathToFile;
  if (resource.pathToFolder) return resource.pathToFolder;

  throw new Error("pathToDocument, pathToLink, pathToFolder or pathToFile must be included in the resource");
}
