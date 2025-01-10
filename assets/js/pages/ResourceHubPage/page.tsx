import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { Paths } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { decorateNodes } from "@/features/ResourceHub/DecoratedNode";

export function Page() {
  const { resourceHub } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");
  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  let nodes = decorateNodes(resourceHub.space!, resourceHub, resourceHub.nodes);

  return (
    <Pages.Page title={resourceHub.name!}>
      <Hub.NewFileModalsProvider resourceHub={resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root size="large">
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <Hub.Header resource={resourceHub} />
              <Hub.NodesList nodes={nodes} refresh={refresh} />
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
    <Paper.Navigation testId="navigation">
      <Paper.NavItem linkTo={Paths.spacePath(resourceHub.space.id!)}>{resourceHub.space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
