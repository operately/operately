import * as React from "react";

import { Navigation } from "../../Page/Navigation";
import type { ResourceHub, ResourceHubFolder, ResourceHubNavigationPaths } from "../types";
import { resourceHubDraftsNavigation } from "./parentNavigation";

interface NewResourcePageNavigationProps {
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
  paths: ResourceHubNavigationPaths;
}

export function NewResourcePageNavigation({ resourceHub, folder, paths }: NewResourcePageNavigationProps) {
  let items = resourceHubDraftsNavigation(resourceHub, paths);

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
