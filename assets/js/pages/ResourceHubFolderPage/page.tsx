import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { folder, nodes } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <Hub.NewFileModalsProvider folder={folder} resourceHub={folder.resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root size="large">
            <Hub.ResourcePageNavigation resource={folder} />

            <Paper.Body minHeight="75vh">
              <Hub.Header resource={folder} />
              <Hub.AddFileWidget folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
              <Hub.NodesList folder={folder} nodes={nodes} type="folder" refetch={refresh} />
              <Hub.AddFolderModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
            </Paper.Body>
          </Paper.Root>
        </Hub.FileDragAndDropArea>
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}
