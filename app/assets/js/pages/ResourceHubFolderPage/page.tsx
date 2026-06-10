import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Hub from "@/features/ResourceHub";
import { useNewFileModalsContext } from "@/features/ResourceHub/contexts/NewFileModalsContext";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { AddFilesButton, FileDragAndDropArea, Header as ResourceHubHeader, IconEdit } from "turboui";
import { resourceHubPermissionsToUi, type ResourceHubNode } from "@/models/resourceHubs";
import { ResourceHubFolder } from "../../api";
import { RenameFolderModal } from "../../features/ResourceHub/components/FolderMenu";
import { useBoolState } from "../../hooks/useBoolState";

export function Page() {
  const { folder, nodes } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <Hub.NewFileModalsProvider folder={folder} resourceHub={folder.resourceHub}>
        <PageContent folder={folder} nodes={nodes} />
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageContent({ folder, nodes }: { folder: ResourceHubFolder; nodes: ResourceHubNode[] }) {
  const refresh = useRefresh();
  const { navigateToNewDocument, toggleShowAddFolder, selectFiles, navigateToNewLink, setFiles } =
    useNewFileModalsContext();

  assertPresent(folder.permissions, "permissions must be present in folder");
  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  const permissions = resourceHubPermissionsToUi(folder.permissions)!;

  return (
    <FileDragAndDropArea onFilesDropped={setFiles}>
      <Paper.Root size="large">
        <Hub.ResourcePageNavigation resource={folder} />

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
          <Hub.AddFileWidget folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
          <Hub.NodesList folder={folder} nodes={nodes} type="folder" refetch={refresh} />
          <Hub.AddFolderModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
        </Paper.Body>
      </Paper.Root>
    </FileDragAndDropArea>
  );
}

function Options({ folder }: { folder: ResourceHubFolder }) {
  assertPresent(folder.permissions, "permissions must be present in folder");

  const [showRenameForm, toggleRenameForm] = useBoolState(false);
  const refresh = useRefresh();

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
      />
    </>
  );
}
