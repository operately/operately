import React from "react";
import * as Paper from "@/components/PaperContainer";

import { ResourceHubFile } from "@/models/resourceHubs";
import { NestedFolderNavigation } from "@/features/ResourceHub";
import { assertPresent } from "@/utils/assertions";

export function FilePageNavigation({ file }: { file: ResourceHubFile }) {
  assertPresent(file.resourceHub, "resourceHub must be present in file");
  assertPresent(file.resourceHub.space, "space must be present in file.resourceHub");
  assertPresent(file.pathToFile, "pathToFile must be present in file");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={file.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={file.resourceHub} />
      <NestedFolderNavigation folders={file.pathToFile} />
    </Paper.Navigation>
  );
}
