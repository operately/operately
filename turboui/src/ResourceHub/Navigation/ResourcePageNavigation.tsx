import * as React from "react";

import { Navigation } from "../../Page/Navigation";
import { assertPresent } from "../../utils/assertions";
import type { ResourceHubDocument, ResourceHubFile, ResourceHubFolder, ResourceHubLink, ResourceHubNavigationPaths } from "../types";
import { resourceHubParentNavigationItem } from "./parentNavigation";

type ResourcePageResource = ResourceHubDocument | ResourceHubFile | ResourceHubFolder | ResourceHubLink;

interface ResourcePageNavigationProps {
  resource: ResourcePageResource;
  paths: ResourceHubNavigationPaths;
  testId?: string;
}

export function ResourcePageNavigation({ resource, paths, testId = "navigation" }: ResourcePageNavigationProps) {
  const path = getPathToResource(resource);

  assertPresent(resource.resourceHub, "resourceHub must be present in resource");
  const parentItem = resourceHubParentNavigationItem(resource.resourceHub, paths);

  const items = [
    ...(parentItem ? [parentItem] : []),
    { to: paths.resourceHubPath(resource.resourceHub.id), label: resource.resourceHub.name ?? "" },
    ...path.map((folder) => ({
      to: paths.resourceHubFolderPath(folder.id),
      label: folder.name ?? "",
    })),
  ];

  return <Navigation items={items} testId={testId} />;
}

function getPathToResource(resource: ResourcePageResource) {
  if ("pathToDocument" in resource) return resource.pathToDocument ?? [];
  if ("pathToLink" in resource) return resource.pathToLink ?? [];
  if ("pathToFile" in resource) return resource.pathToFile ?? [];
  if ("pathToFolder" in resource) return resource.pathToFolder ?? [];

  throw new Error("pathToDocument, pathToLink, pathToFolder or pathToFile must be included in the resource");
}
