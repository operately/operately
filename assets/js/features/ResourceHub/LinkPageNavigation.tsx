import React from "react";
import * as Paper from "@/components/PaperContainer";

import { ResourceHubLink } from "@/models/resourceHubs";
import { assertPresent } from "@/utils/assertions";
import { NestedFolderNavigation } from "@/features/ResourceHub";

export function LinkPageNavigation({ link }: { link: ResourceHubLink }) {
  assertPresent(link.resourceHub, "resourceHub must be present in link");
  assertPresent(link.resourceHub.space, "space must be present in link.resourceHub");
  assertPresent(link.pathToLink, "pathToLink must be present in link");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={link.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={link.resourceHub} />
      <NestedFolderNavigation folders={link.pathToLink} />
    </Paper.Navigation>
  );
}
