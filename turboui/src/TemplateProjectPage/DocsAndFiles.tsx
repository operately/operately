import React from "react";
import { useLocation, useNavigate } from "react-router";

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
import { TemplateResourceMenu } from "./TemplateResourceMenu";
import { findFolder, folderBreadcrumbs, nodesInFolder } from "./resourceTree";

type ResourceNode = TemplateProjectPage.ResourceNode;

const ROOT_TITLE = "Documents & Files";

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
  resourceNodes: ResourceNode[];
  canEdit: boolean;
  newDocumentLink: string;
  newLinkLink: string;
  onFolderCreate: (parentFolderId: string | null, name: string) => Promise<boolean>;
  onFolderRename?: (folderId: string, name: string) => Promise<boolean>;
  onResourceDelete?: (nodeId: string) => Promise<boolean>;
  onResourceMove?: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
  onFilesUpload: TemplateProjectPage.Props["onFilesUpload"];
  formatFileSize: TemplateProjectPage.Props["formatFileSize"];
  richTextHandlers: TemplateProjectPage.Props["richTextHandlers"];
}

export function DocsAndFiles({ props }: { props: TemplateProjectPage.Props }) {
  return (
    <TemplateDocsAndFiles
      templateId={props.template.id}
      resourceNodes={props.resourceNodes ?? []}
      canEdit={Boolean(props.permissions.canEdit || props.permissions.hasFullAccess)}
      newDocumentLink={props.newDocumentLink}
      newLinkLink={props.newLinkLink}
      onFolderCreate={props.onFolderCreate}
      onFolderRename={props.onFolderRename}
      onResourceDelete={props.onResourceDelete}
      onResourceMove={props.onResourceMove}
      onFilesUpload={props.onFilesUpload}
      formatFileSize={props.formatFileSize}
      richTextHandlers={props.richTextHandlers}
    />
  );
}

function folderIdFromLocation(search: string) {
  return new URLSearchParams(search).get("folderId");
}

function TemplateDocsAndFiles(props: TemplateDocsAndFilesProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const folderIdFromUrl = folderIdFromLocation(location.search);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(folderIdFromUrl);
  const [showNewFolder, setShowNewFolder] = React.useState(false);

  React.useEffect(() => {
    setCurrentFolderId(folderIdFromUrl);
  }, [folderIdFromUrl]);

  const fileSelection = useAddFile();
  const currentFolder = findFolder(props.resourceNodes, currentFolderId);
  const effectiveFolderId = currentFolder?.folderId ?? null;
  const ancestorFolders = folderBreadcrumbs(props.resourceNodes, effectiveFolderId);
  const navigateToNewDocument = React.useCallback(() => {
    navigate(withQuery(props.newDocumentLink, { folderId: effectiveFolderId }));
  }, [navigate, props.newDocumentLink, effectiveFolderId]);
  const navigateToNewLink = React.useCallback(
    (type?: ResourceHubLinkType) => {
      navigate(withQuery(props.newLinkLink, { folderId: effectiveFolderId, type }));
    },
    [navigate, props.newLinkLink, effectiveFolderId],
  );
  const modalContext = React.useMemo(
    () => ({
      ...fileSelection,
      showAddFolder: showNewFolder,
      toggleShowAddFolder: () => setShowNewFolder((open) => !open),
      navigateToNewDocument,
      navigateToNewLink,
    }),
    [fileSelection, showNewFolder, navigateToNewDocument, navigateToNewLink],
  );
  const openFolder = React.useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
  }, []);
  const items = nodesInFolder(props.resourceNodes, effectiveFolderId).map((node) =>
    toDocsAndFilesItem(node, {
      canEdit: props.canEdit,
      resourceNodes: props.resourceNodes,
      currentFolderId: effectiveFolderId,
      onRename: props.onFolderRename,
      onMove: props.onResourceMove,
      onDelete: props.onResourceDelete,
      onOpenFolder: node.type === "folder" && node.folderId ? () => openFolder(node.folderId!) : undefined,
    }),
  );
  const uploadFiles: AddFileWidgetProps["onUpload"] = async (files, setProgress) => {
    const uploaded = await props.onFilesUpload(files, setProgress, effectiveFolderId);
    if (!uploaded) {
      throw new Error("Template files were not uploaded");
    }
  };
  const breadcrumbs =
    ancestorFolders.length > 0
      ? [
          { label: ROOT_TITLE, onClick: () => setCurrentFolderId(null) },
          ...ancestorFolders.slice(0, -1).map((folder) => ({
            label: folder.name,
            onClick: () => setCurrentFolderId(folder.folderId ?? null),
          })),
        ]
      : undefined;
  const content = (
    <>
      <DocsAndFilesTab
        title={currentFolder?.name ?? ROOT_TITLE}
        items={items}
        breadcrumbs={breadcrumbs}
        emptyStateKind={effectiveFolderId ? "folder" : "resourceHub"}
        hideEmptyState={fileSelection.filesSelected}
        actions={
          props.canEdit ? (
            <AddFilesButton
              permissions={templateResourcePermissions}
              onNewDocument={navigateToNewDocument}
              onNewFolder={() => setShowNewFolder(true)}
              onUploadFiles={fileSelection.selectFiles}
              onNewLink={navigateToNewLink}
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
        folderId={effectiveFolderId ?? undefined}
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

function withQuery(path: string, params: { folderId?: string | null; type?: string }) {
  const search = new URLSearchParams();
  if (params.folderId) search.set("folderId", params.folderId);
  if (params.type) search.set("type", params.type);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

function toDocsAndFilesItem(
  node: ResourceNode,
  options: {
    canEdit: boolean;
    resourceNodes: ResourceNode[];
    currentFolderId: string | null;
    onRename?: (folderId: string, name: string) => Promise<boolean>;
    onMove?: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
    onDelete?: (nodeId: string) => Promise<boolean>;
    onOpenFolder?: () => void;
  },
) {
  const showMenu = options.canEdit && (options.onRename || options.onMove || options.onDelete);

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    link: node.link,
    onClick: options.onOpenFolder,
    insertedAt: node.insertedAt,
    updatedAt: node.updatedAt,
    fileKind: node.fileKind,
    thumbnail: node.thumbnail,
    menu: showMenu ? (
      <TemplateResourceMenu
        node={node}
        resourceNodes={options.resourceNodes}
        currentFolderId={options.currentFolderId}
        onRename={options.onRename}
        onMove={options.onMove}
        onDelete={options.onDelete}
      />
    ) : undefined,
  };
}
