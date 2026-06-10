import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import {
  AddFileWidget,
  AddFilesButton,
  AddFolderModal,
  ContinueEditingDrafts,
  FileDragAndDropArea,
  Header as ResourceHubHeader,
  NewFileModalsProvider,
  useNewFileModalsContext,
} from "turboui";
import { draftNodeToUiNode, folders, resourceHubPermissionsToUi, useNewFileModalsContextValue } from "@/models/resourceHubs";
import type { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";
import { useAddFileWidgetProps } from "@/features/ResourceHub/useAddFileWidgetProps";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import type { ResourceHubFormsApi } from "turboui";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  const newFileModalsContext = useNewFileModalsContextValue({ resourceHub });

  return (
    <Pages.Page title={resourceHub.name!}>
      <NewFileModalsProvider value={newFileModalsContext}>
        <PageContent resourceHub={resourceHub} nodes={nodes} draftNodes={draftNodes} />
      </NewFileModalsProvider>
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
  const addFileWidgetProps = useAddFileWidgetProps({ resourceHub, onUploaded: refresh });
  const [createFolder] = folders.useCreate();

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
          <AddFileWidget {...addFileWidgetProps} />
          <Hub.NodesList resourceHub={resourceHub} type="resource_hub" nodes={nodes} refetch={refresh} />
          <AddFolderModal
            resourceHubId={resourceHub.id!}
            onCreated={refresh}
            forms={Forms as unknown as ResourceHubFormsApi}
            modal={{ Modal }}
            onCreateFolder={async (args) => {
              await createFolder({
                resourceHubId: args.resourceHubId,
                folderId: args.folderId,
                name: args.name,
              });
            }}
          />
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
