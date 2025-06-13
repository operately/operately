import React from "react";

import * as Paper from "@/components/PaperContainer";
import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";

interface Props {
  resourceHub: ResourceHub;
  folder: ResourceHubFolder | undefined;
}

export function NewResourcePageNavigation({ resourceHub, folder }: Props) {
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  let items = [
    { to: DeprecatedPaths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! },
    { to: DeprecatedPaths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
  ];

  if (folder) {
    items = items.concat(folderNavItems(folder));
  }

  return <Paper.Navigation items={items} />;
}

function folderNavItems(folder: ResourceHubFolder) {
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return folder.pathToFolder.map((folder) => ({
    to: DeprecatedPaths.resourceHubFolderPath(folder.id!),
    label: folder.name!,
  }));
}
