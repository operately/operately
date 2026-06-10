import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import { useNewFileModalsContext } from "@/features/ResourceHub/contexts/NewFileModalsContext";
import { AddFilesButton, ContinueEditingDrafts, FileDragAndDropArea, Header as ResourceHubHeader } from "turboui";
import { draftNodeToUiNode, resourceHubPermissionsToUi } from "@/models/resourceHubs";
import type { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Hub.NewFileModalsProvider resourceHub={resourceHub}>
        <PageContent resourceHub={resourceHub} nodes={nodes} draftNodes={draftNodes} />
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageContent({
  resourceHub,
  nodes,
  draftNodes,
}: {
  resourceHub: ResourceHub;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
}) {
  const refresh = useRefresh();
  const paths = usePaths();
  const draftUiNodes = draftNodes.map((node) => draftNodeToUiNode(paths, node));
  const { navigateToNewDocument, toggleShowAddFolder, selectFiles, navigateToNewLink, setFiles } =
    useNewFileModalsContext();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");
  const permissions = resourceHubPermissionsToUi(resourceHub.permissions)!;

  return (
    <FileDragAndDropArea onFilesDropped={setFiles}>
      <Paper.Root size="large">
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <ResourceHubHeader
            title={resourceHub.name!}
            actions={
              <AddFilesButton
                permissions={permissions}
                onNewDocument={navigateToNewDocument}
                onNewFolder={toggleShowAddFolder}
                onUploadFiles={selectFiles}
                onNewLink={navigateToNewLink}
              />
            }
          />
          <ContinueEditingDrafts drafts={draftUiNodes} draftsPath={paths.resourceHubDraftsPath(resourceHub.id!)} />
          <Hub.AddFileWidget resourceHub={resourceHub} refresh={refresh} />
          <Hub.NodesList resourceHub={resourceHub} type="resource_hub" nodes={nodes} refetch={refresh} />
          <Hub.AddFolderModal resourceHub={resourceHub} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </FileDragAndDropArea>
  );
}

function PageNavigation() {
  const { resourceHub } = useLoadedData();
  const paths = usePaths();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation
      testId="navigation"
      items={[{ to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! }]}
    />
  );
}
