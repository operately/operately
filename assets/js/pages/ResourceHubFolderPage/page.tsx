import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { folder } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(folder.nodes, "nodes must be present in folder");
  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <Hub.NewFileModalsProvider folder={folder} resourceHub={folder.resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root size="large">
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <Hub.Header resource={folder} />
              <Hub.NodesList folder={folder} type="folder" refetch={refresh} />
              <Hub.AddFolderModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
              <Hub.AddFileModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
            </Paper.Body>
          </Paper.Root>
        </Hub.FileDragAndDropArea>
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { folder } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.resourceHub.space, "space must be present in folder.resourceHub");
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavSpaceLink space={folder.resourceHub.space} />
      <Paper.NavSeparator />
      <Paper.NavResourceHubLink resourceHub={folder.resourceHub} />
      <Hub.NestedFolderNavigation folders={folder.pathToFolder} />
    </Paper.Navigation>
  );
}
