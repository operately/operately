import * as React from "react";

import { Navigation } from "../../Page/Navigation";
import { assertPresent } from "../../utils/assertions";
import type {
  ResourceHubNavigationPaths,
  ResourceHubNewResourceNavigationFolder,
  ResourceHubNewResourceNavigationResourceHub,
} from "../types";

interface NewResourcePageNavigationProps {
  resourceHub: ResourceHubNewResourceNavigationResourceHub;
  folder?: ResourceHubNewResourceNavigationFolder;
  paths: ResourceHubNavigationPaths;
}

export function NewResourcePageNavigation({ resourceHub, folder, paths }: NewResourcePageNavigationProps) {
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  let items = [
    { to: paths.spacePath(resourceHub.space.id), label: resourceHub.space.name ?? "" },
    { to: paths.resourceHubPath(resourceHub.id), label: resourceHub.name ?? "" },
  ];

  if (folder?.pathToFolder) {
    items = items.concat(
      folder.pathToFolder.map((item) => ({
        to: paths.resourceHubFolderPath(item.id),
        label: item.name ?? "",
      })),
    );
  }

  return <Navigation items={items} />;
}
