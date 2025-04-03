import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Resource } from "@/models/resourceHubs";

export function ResourcePageNavigation({ resource }: { resource: Resource }) {
  assertPresent(resource.resourceHub, "resourceHub must be present in document");
  assertPresent(resource.resourceHub.space, "space must be present in document.resourceHub");
  const path = getPathToResource(resource);

  let items = [
    { to: Paths.spacePath(resource.resourceHub.space.id!), label: resource.resourceHub.space.name! },
    { to: Paths.resourceHubPath(resource.resourceHub.id!), label: resource.resourceHub.name! },
  ];

  items = items.concat(
    path.map((folder) => ({
      to: Paths.resourceHubFolderPath(folder.id!),
      label: folder.name!,
    })),
  );

  return <Paper.Navigation testId="navigation" items={items} />;
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
