import React from "react";

import * as Paper from "@/components/PaperContainer";
import { ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";
import { NestedFolderNavigation } from "./NestedFolderNavigation";

interface Props {
  resourceHub: ResourceHub;
  folder: ResourceHubFolder | undefined;
}

export function NewResourcePageNavigation({ resourceHub, folder }: Props) {
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation>
      <Paper.NavSpaceLink space={resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={resourceHub} />

      {folder && <FolderNavigationWrapper folder={folder} />}
    </Paper.Navigation>
  );
}

function FolderNavigationWrapper({ folder }: { folder: ResourceHubFolder }) {
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return (
    <>
      <NestedFolderNavigation folders={folder.pathToFolder} />
      <Paper.NavSeparator />
      <Paper.NavFolderLink folder={folder} />
    </>
  );
}
