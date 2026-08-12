import React from "react";

import { DocsAndFilesTab } from "../DocsAndFiles";
import { AddFilesButton } from "../ResourceHub/AddFilesButton";
import { AddFolderModal } from "../ResourceHub/AddFolderModal";
import type { ResourceHubLinkType, ResourceHubPermissions } from "../ResourceHub/types";
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
}

export function DocsAndFiles({ props }: { props: TemplateProjectPage.Props }) {
  return (
    <TemplateDocsAndFiles
      title="Documents & Files"
      parentFolderId={null}
      resourceNodes={props.resourceNodes ?? []}
      canEdit={Boolean(props.permissions.canEdit || props.permissions.hasFullAccess)}
      onFolderCreate={props.onFolderCreate}
    />
  );
}

function TemplateDocsAndFiles(props: TemplateDocsAndFilesProps) {
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const items = props.resourceNodes
    .filter((node) => node.parentFolderId === props.parentFolderId)
    .map(toDocsAndFilesItem);

  return (
    <>
      <DocsAndFilesTab
        title={props.title}
        items={items}
        emptyStateKind={props.parentFolderId ? "folder" : "resourceHub"}
        actions={props.canEdit ? (
          <AddFilesButton
            permissions={templateResourcePermissions}
            onNewDocument={ignoreResourceAction}
            onNewFolder={() => setShowNewFolder(true)}
            onUploadFiles={ignoreResourceAction}
            onNewLink={ignoreLinkAction}
          />
        ) : undefined}
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
  };
}
