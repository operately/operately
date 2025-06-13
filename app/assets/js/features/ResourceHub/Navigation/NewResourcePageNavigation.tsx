import React from "react";

import * as Paper from "@/components/PaperContainer";
import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";

import { usePaths } from "@/routes/paths";
interface Props {
  resourceHub: ResourceHub;
  folder: ResourceHubFolder | undefined;
}

export function NewResourcePageNavigation({ resourceHub, folder }: Props) {
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  let items = [
    { to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! },
    { to: paths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
  ];

  if (folder) {
    items = items.concat(folderNavItems(folder));
  }

  return <Paper.Navigation items={items} />;
}

function folderNavItems(folder: ResourceHubFolder) {
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return folder.pathToFolder.map((folder) => ({
    to: paths.resourceHubFolderPath(folder.id!),
    label: folder.name!,
  }));
}
