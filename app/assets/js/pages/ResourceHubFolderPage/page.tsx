import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import {
  AddFileWidget,
  AddFilesButton,
  AddFolderModal,
  FileDragAndDropArea,
  Header as ResourceHubHeader,
  IconEdit,
  NewFileModalsProvider,
  NodesList,
  RenameFolderModal,
  ResourcePageNavigation,
  useNewFileModalsContext,
} from "turboui";
import {
  folders,
  resourceHubPermissionsToUi,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
  type ResourceHubNode,
} from "@/models/resourceHubs";
import { ResourceHubFolder } from "../../api";
import { useBoolState } from "../../hooks/useBoolState";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import type { ResourceHubFormsApi } from "turboui";

export function Page() {
  const { folder, nodes } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  const newFileModalsContext = useNewFileModalsContextValue({
    resourceHub: folder.resourceHub,
    folder,
  });

  return (
    <Pages.Page title={folder.name!}>
      <NewFileModalsProvider value={newFileModalsContext}>
        <PageContent folder={folder} nodes={nodes} />
      </NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageContent({ folder, nodes }: { folder: ResourceHubFolder; nodes: ResourceHubNode[] }) {
  const refresh = useRefresh();
  const paths = usePaths();
  const { navigateToNewDocument, toggleShowAddFolder, selectFiles, navigateToNewLink, setFiles } =
    useNewFileModalsContext();
  const addFileWidgetProps = useAddFileWidgetProps({
    resourceHub: folder.resourceHub!,
    folder,
    onUploaded: refresh,
  });
  const [createFolder] = folders.useCreate();
  const nodesListProps = useResourceHubNodesListProps({ folder, nodes, type: "folder", refetch: refresh });

  assertPresent(folder.permissions, "permissions must be present in folder");
  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  const permissions = resourceHubPermissionsToUi(folder.permissions)!;

  return (
    <FileDragAndDropArea onFilesDropped={setFiles}>
      <Paper.Root size="large">
        <ResourcePageNavigation
          resource={folder}
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body minHeight="75vh">
          <Options folder={folder} />
          <ResourceHubHeader
            title={folder.name!}
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
          <AddFileWidget {...addFileWidgetProps} />
          <NodesList {...nodesListProps} />
          <AddFolderModal
            resourceHubId={folder.resourceHub.id!}
            folderId={folder.id}
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

function Options({ folder }: { folder: ResourceHubFolder }) {
  assertPresent(folder.permissions, "permissions must be present in folder");

  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const refresh = useRefresh();
  const [rename] = folders.useRename();

  if (!folder.permissions.canRenameFolder) {
    return null;
  }

  return (
    <>
      <PageOptions.Root testId="options-button">
        <PageOptions.Action icon={IconEdit} title="Rename" onClick={toggleRenameForm} testId="rename-folder" />
      </PageOptions.Root>

      <RenameFolderModal
        folder={folder}
        showForm={showRenameForm}
        toggleForm={toggleRenameForm}
        // Key is needed because when the folder's name changes, if the component
        // is not rerendered, the old name will appear in the form
        key={folder.name}
        onSave={refresh}
        forms={Forms as unknown as ResourceHubFormsApi}
        modal={{ Modal }}
        onRename={async (id, name) => {
          await rename({ folderId: id, newName: name });
        }}
      />
    </>
  );
}
