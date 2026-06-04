import React from "react";

import * as Paper from "@/components/PaperContainer";
import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { Paths, usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { resourceHubParentItem } from "./resourceHubNavigation";

interface Props {
  resourceHub: ResourceHub;
  folder: ResourceHubFolder | undefined;
}

export function NewResourcePageNavigation({ resourceHub, folder }: Props) {
  const paths = usePaths();

  let items = [
    resourceHubParentItem(paths, resourceHub),
    { to: paths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
  ];

  if (folder) {
    items = items.concat(folderNavItems(paths, folder));
  }

  return <Paper.Navigation items={items} />;
}

function folderNavItems(paths: Paths, folder: ResourceHubFolder) {
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return folder.pathToFolder.map((folder) => ({
    to: paths.resourceHubFolderPath(folder.id!),
    label: folder.name!,
  }));
}
