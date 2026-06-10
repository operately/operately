import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as ResourceHub from "@/features/ResourceHub";
import { useNewFileModalsContext } from "@/features/ResourceHub/contexts/NewFileModalsContext";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { AddFilesButton, FileDragAndDropArea, Header as ResourceHubHeader, IconEdit, RenameFolderModal } from "turboui";
import { resourceHubPermissionsToUi, folders, type ResourceHubNode } from "@/models/resourceHubs";
import { ResourceHubFolder } from "../../api";
import { useBoolState } from "../../hooks/useBoolState";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import type { ResourceHubFormsApi } from "turboui";

export function Page() {
  const { folder, nodes } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <ResourceHub.NewFileModalsProvider folder={folder} resourceHub={folder.resourceHub}>
        <PageContent folder={folder} nodes={nodes} />
      </ResourceHub.NewFileModalsProvider>
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
        <ResourceHub.ResourcePageNavigation resource={folder} />

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
          <ResourceHub.AddFileWidget folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
          <ResourceHub.NodesList folder={folder} nodes={nodes} type="folder" refetch={refresh} />
          <ResourceHub.AddFolderModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
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
