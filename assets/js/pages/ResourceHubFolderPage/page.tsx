import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { AddFilesButtonAndForms, NodesList, ZeroNodes } from "@/features/ResourceHub";

export function Page() {
  const { folder } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(folder.nodes, "nodes must be present in folder");
  assertPresent(folder.resourceHub, "resourceHub must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <Paper.Root>
        <Paper.Body minHeight="75vh">
          <Paper.Header
            actions={
              <AddFilesButtonAndForms resourceHub={folder.resourceHub} refresh={refresh} folderId={folder.id!} />
            }
            title={folder.name!}
            layout="title-center-actions-left"
          />

          {folder.nodes.length < 1 ? <ZeroNodes /> : <NodesList nodes={folder.nodes} />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
