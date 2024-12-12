import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { Paths } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function Page() {
  const { resourceHub } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");
  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Hub.NewFileModalsProvider resourceHub={resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root>
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <Paper.Header
                actions={<Hub.AddFilesButton />}
                title={resourceHub.name!}
                layout="title-center-actions-left"
              />

              <Hub.NodesList nodes={resourceHub.nodes} permissions={resourceHub.permissions} refetch={refresh} />

              <Hub.AddFolderModal resourceHub={resourceHub} refresh={refresh} />
              <Hub.AddFileModal resourceHub={resourceHub} refresh={refresh} />
            </Paper.Body>
          </Paper.Root>
        </Hub.FileDragAndDropArea>
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(resourceHub.space.id!)}>{resourceHub.space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
