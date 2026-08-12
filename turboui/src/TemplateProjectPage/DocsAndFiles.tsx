import React from "react";

import { DocsAndFilesTab } from "../DocsAndFiles";
import { AddFileWidget } from "../ResourceHub/AddFileWidget";
import { AddFilesButton } from "../ResourceHub/AddFilesButton";
import { AddFolderModal } from "../ResourceHub/AddFolderModal";
import { NewFileModalsProvider } from "../ResourceHub/contexts/NewFileModalsContext";
import { FileDragAndDropArea } from "../ResourceHub/FileDragAndDropArea";
import type { ResourceHubLinkType, ResourceHubPermissions } from "../ResourceHub/types";
import { useAddFile } from "../ResourceHub/useAddFile";
import { TemplateProjectPage } from ".";

type ResourceNode = TemplateProjectPage.ResourceNode;

const templateResourcePermissions: ResourceHubPermissions = {
  __typename: "resource_hub_permissions",
  canCreateDocument: true,
  canCreateFolder: true,
  canCreateFile: true,
  canCreateLink: true,
};

interface TemplateDocsAndFilesProps {
  title: string;
  parentFolderId: string | null;
  resourceNodes: ResourceNode[];
  canEdit: boolean;
  onFolderCreate: (parentFolderId: string | null, name: string) => Promise<boolean>;
  onFilesUpload: TemplateProjectPage.Props["onFilesUpload"];
  formatFileSize: TemplateProjectPage.Props["formatFileSize"];
  richTextHandlers: TemplateProjectPage.Props["richTextHandlers"];
}

export function DocsAndFiles({ props }: { props: TemplateProjectPage.Props }) {
  return (
    <TemplateDocsAndFiles
      title="Documents & Files"
      parentFolderId={null}
      resourceNodes={props.resourceNodes ?? []}
      canEdit={Boolean(props.permissions.canEdit || props.permissions.hasFullAccess)}
      onFolderCreate={props.onFolderCreate}
      onFilesUpload={props.onFilesUpload}
      formatFileSize={props.formatFileSize}
      richTextHandlers={props.richTextHandlers}
    />
  );
}

function TemplateDocsAndFiles(props: TemplateDocsAndFilesProps) {
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const fileSelection = useAddFile();
  const modalContext = React.useMemo(
    () => ({
      ...fileSelection,
      showAddFolder: showNewFolder,
      toggleShowAddFolder: () => setShowNewFolder((open) => !open),
      navigateToNewDocument: ignoreResourceAction,
      navigateToNewLink: ignoreLinkAction,
    }),
    [fileSelection, showNewFolder],
  );
  const items = props.resourceNodes
    .filter((node) => node.parentFolderId === props.parentFolderId)
    .map(toDocsAndFilesItem);
  const content = (
    <>
      <DocsAndFilesTab
        title={props.title}
        items={items}
        emptyStateKind={props.parentFolderId ? "folder" : "resourceHub"}
        hideEmptyState={fileSelection.filesSelected}
        actions={
          props.canEdit ? (
            <AddFilesButton
              permissions={templateResourcePermissions}
              onNewDocument={ignoreResourceAction}
              onNewFolder={() => setShowNewFolder(true)}
              onUploadFiles={fileSelection.selectFiles}
              onNewLink={ignoreLinkAction}
            />
          ) : undefined
        }
        beforeItems={
          props.canEdit ? (
            <AddFileWidget
              richTextHandlers={props.richTextHandlers}
              formatFileSize={props.formatFileSize}
              onUpload={props.onFilesUpload}
            />
          ) : undefined
        }
      />
      <AddFolderModal
        parentFolderId={props.parentFolderId ?? undefined}
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onCreated={ignoreResourceAction}
        onCreateFolder={({ parentFolderId, name }) => props.onFolderCreate(parentFolderId ?? null, name)}
      />
    </>
  );

  return (
    <NewFileModalsProvider value={modalContext}>
      {props.canEdit ? <FileDragAndDropArea onFilesDropped={fileSelection.setFiles}>{content}</FileDragAndDropArea> : content}
    </NewFileModalsProvider>
  );
}

function ignoreResourceAction() {}

function ignoreLinkAction(_type?: ResourceHubLinkType) {}

function toDocsAndFilesItem(node: ResourceNode) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    link: node.link,
    insertedAt: node.insertedAt,
    updatedAt: node.updatedAt,
    fileKind: node.fileKind,
    thumbnail: node.thumbnail,
  };
}
