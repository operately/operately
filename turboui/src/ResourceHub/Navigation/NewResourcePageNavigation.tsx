import * as React from "react";

import { Navigation } from "../../Page/Navigation";
import type { ResourceHub, ResourceHubFolder, ResourceHubNavigationPaths } from "../types";
import { resourceHubParentNavigationItem } from "./parentNavigation";

interface NewResourcePageNavigationProps {
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
  paths: ResourceHubNavigationPaths;
}

export function NewResourcePageNavigation({ resourceHub, folder, paths }: NewResourcePageNavigationProps) {
  const parentItem = resourceHubParentNavigationItem(resourceHub, paths);

  let items = [
    ...(parentItem ? [parentItem] : []),
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
