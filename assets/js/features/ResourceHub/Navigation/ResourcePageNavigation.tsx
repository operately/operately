import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { assertPresent } from "@/utils/assertions";
import { NestedFolderNavigation } from "@/features/ResourceHub";
import { Resource } from "@/models/resourceHubs";

export function ResourcePageNavigation({ resource }: { resource: Resource }) {
  assertPresent(resource.resourceHub, "resourceHub must be present in document");
  assertPresent(resource.resourceHub.space, "space must be present in document.resourceHub");
  const path = getPathToResource(resource);

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={resource.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={resource.resourceHub} />
      <NestedFolderNavigation folders={path} />
    </Paper.Navigation>
  );
}

function getPathToResource(resource: Resource) {
  if ("pathToDocument" in resource) {
    assertPresent(resource.pathToDocument, "pathToDocument must be present in document");
    return resource.pathToDocument;
  }
  if ("pathToLink" in resource) {
    assertPresent(resource.pathToLink, "pathToLink must be present in link");
    return resource.pathToLink;
  }
  if ("pathToFile" in resource) {
    assertPresent(resource.pathToFile, "pathToFile must be present in file");
    return resource.pathToFile;
  }
  if ("pathToFolder" in resource) {
    assertPresent(resource.pathToFolder, "pathToFolder must be present in folder");
    return resource.pathToFolder;
  }

  throw new Error("pathToDocument, pathToLink, pathToFolder or pathToFile must be included in the resource");
}
