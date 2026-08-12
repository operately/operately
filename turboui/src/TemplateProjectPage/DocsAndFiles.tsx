import React from "react";
import { useNavigate } from "react-router";

import { DocsAndFilesTab } from "../DocsAndFiles";
import { AddFileWidget, type AddFileWidgetProps } from "../ResourceHub/AddFileWidget";
import { AddFilesButton } from "../ResourceHub/AddFilesButton";
import { AddFolderModal } from "../ResourceHub/AddFolderModal";
import { NewFileModalsProvider } from "../ResourceHub/contexts/NewFileModalsContext";
import { FileDragAndDropArea } from "../ResourceHub/FileDragAndDropArea";
import type { ResourceHubLinkType, ResourceHubPermissions } from "../ResourceHub/types";
import { useAddFile } from "../ResourceHub/useAddFile";
import { SubscribersSelector } from "../Subscriptions";
import { TemplateProjectPage } from ".";

type ResourceNode = TemplateProjectPage.ResourceNode;

const templateResourcePermissions: ResourceHubPermissions = {
  __typename: "resource_hub_permissions",
  canCreateDocument: true,
  canCreateFolder: true,
  canCreateFile: true,
  canCreateLink: true,
};

const emptySubscriptions: SubscribersSelector.Props = {
  subscribers: [],
  selectedSubscribers: [],
  onSelectedSubscribersChange: ignoreResourceAction,
  subscriptionType: SubscribersSelector.SubscriptionOption.NONE,
  onSubscriptionTypeChange: ignoreResourceAction,
  alwaysNotify: [],
  allSubscribersLabel: "No one",
};

interface TemplateDocsAndFilesProps {
  templateId: string;
  title: string;
  parentFolderId: string | null;
  resourceNodes: ResourceNode[];
  canEdit: boolean;
  newDocumentLink: string;
  onFolderCreate: (parentFolderId: string | null, name: string) => Promise<boolean>;
  onFilesUpload: TemplateProjectPage.Props["onFilesUpload"];
  formatFileSize: TemplateProjectPage.Props["formatFileSize"];
  richTextHandlers: TemplateProjectPage.Props["richTextHandlers"];
}

export function DocsAndFiles({ props }: { props: TemplateProjectPage.Props }) {
  return (
    <TemplateDocsAndFiles
      templateId={props.template.id}
      title="Documents & Files"
      parentFolderId={null}
      resourceNodes={props.resourceNodes ?? []}
      canEdit={Boolean(props.permissions.canEdit || props.permissions.hasFullAccess)}
      newDocumentLink={props.newDocumentLink}
      onFolderCreate={props.onFolderCreate}
      onFilesUpload={props.onFilesUpload}
      formatFileSize={props.formatFileSize}
      richTextHandlers={props.richTextHandlers}
    />
  );
}

function TemplateDocsAndFiles(props: TemplateDocsAndFilesProps) {
  const navigate = useNavigate();
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const fileSelection = useAddFile();
  const navigateToNewDocument = React.useCallback(() => {
    navigate(props.newDocumentLink);
  }, [navigate, props.newDocumentLink]);
  const modalContext = React.useMemo(
    () => ({
      ...fileSelection,
      showAddFolder: showNewFolder,
      toggleShowAddFolder: () => setShowNewFolder((open) => !open),
      navigateToNewDocument,
      navigateToNewLink: ignoreLinkAction,
    }),
    [fileSelection, showNewFolder, navigateToNewDocument],
  );
  const items = props.resourceNodes
    .filter((node) => node.parentFolderId === props.parentFolderId)
    .map(toDocsAndFilesItem);
  const uploadFiles: AddFileWidgetProps["onUpload"] = async (files, setProgress) => {
    const uploaded = await props.onFilesUpload(files, setProgress);
    if (!uploaded) {
      throw new Error("Template files were not uploaded");
    }
  };
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
              onNewDocument={navigateToNewDocument}
              onNewFolder={() => setShowNewFolder(true)}
              onUploadFiles={fileSelection.selectFiles}
              onNewLink={ignoreLinkAction}
            />
          ) : undefined
        }
        beforeItems={
          props.canEdit ? (
            <AddFileWidget
              subscriptions={emptySubscriptions}
              richTextHandlers={props.richTextHandlers}
              formatFileSize={props.formatFileSize}
              onUpload={uploadFiles}
            />
          ) : undefined
        }
      />
      <AddFolderModal
        resourceHubId={props.templateId}
        folderId={props.parentFolderId ?? undefined}
        onCreated={ignoreResourceAction}
        onCreateFolder={async ({ folderId, name }) => {
          const created = await props.onFolderCreate(folderId ?? null, name);
          if (!created) {
            throw new Error("Template folder was not created");
          }
        }}
      />
    </>
  );

  return (
    <NewFileModalsProvider value={modalContext}>
      {props.canEdit ? (
        <FileDragAndDropArea onFilesDropped={fileSelection.setFiles}>{content}</FileDragAndDropArea>
      ) : (
        content
      )}
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
