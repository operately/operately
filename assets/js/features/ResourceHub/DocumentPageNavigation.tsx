import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { assertPresent } from "@/utils/assertions";
import { NestedFolderNavigation } from "@/features/ResourceHub";
import { ResourceHubDocument } from "@/models/resourceHubs";

export function DocumentPageNavigation({ document }: { document: ResourceHubDocument }) {
  assertPresent(document.resourceHub, "resourceHub must be present in document");
  assertPresent(document.resourceHub.space, "space must be present in document.resourceHub");
  assertPresent(document.pathToDocument, "pathToDocument must be present in document");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={document.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={document.resourceHub} />
      <NestedFolderNavigation folders={document.pathToDocument} />
    </Paper.Navigation>
  );
}
