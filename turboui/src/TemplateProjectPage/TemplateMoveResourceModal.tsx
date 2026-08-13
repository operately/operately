import React from "react";

import * as Forms from "../Forms";
import { FolderSelectField } from "../FolderSelectField";
import Modal from "../Modal";
import { ResourceHubTypeIcon } from "../ResourceHub/NodeIcon";
import { sortNodesWithFoldersFirst } from "../ResourceHub/utils";
import type { TemplateProjectPage } from ".";
import { blockedDestinationFolderIds, findFolder, nodesInFolder } from "./resourceTree";

type ResourceNode = TemplateProjectPage.ResourceNode;

export function TemplateMoveResourceModal({
  node,
  resourceNodes,
  currentFolderId,
  isOpen,
  hideModal,
  onMove,
}: {
  node: ResourceNode;
  resourceNodes: ResourceNode[];
  currentFolderId: string | null;
  isOpen: boolean;
  hideModal: () => void;
  onMove: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
}) {
  const blockedFolderIds = React.useMemo(() => blockedDestinationFolderIds(node, resourceNodes), [node, resourceNodes]);

  const form = Forms.useForm({
    fields: {
      location: { id: currentFolderId },
    },
    validate: (addError: (field: string, message: string) => void) => {
      const destinationId = (form.values.location as { id: string | null }).id;
      if (destinationId && blockedFolderIds.has(destinationId)) {
        addError("location", "Folder cannot be moved inside itself.");
      }
    },
    cancel: hideModal,
    submit: async () => {
      const destinationId = (form.values.location as { id: string | null }).id;
      if ((node.parentFolderId ?? null) === destinationId) {
        hideModal();
        return;
      }

      const moved = await onMove(node.id, destinationId);
      if (moved) hideModal();
    },
  });

  return (
    <Modal title={`Move ${node.name}`} isOpen={isOpen} onClose={hideModal}>
      <Forms.Form form={form} testId="move-resource-modal">
        <Forms.FieldGroup>
          <DestinationFolderSelect field="location" nodes={resourceNodes} blockedFolderIds={blockedFolderIds} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Move Here" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function DestinationFolderSelect({
  field,
  nodes,
  blockedFolderIds,
}: {
  field: string;
  nodes: ResourceNode[];
  blockedFolderIds: Set<string>;
}) {
  const [location, setLocation] = Forms.useFieldValue<{ id: string | null }>(field);
  const error = Forms.useFieldError(field);
  const currentFolderId = location?.id ?? null;
  const currentFolder = findFolder(nodes, currentFolderId);
  const children = sortNodesWithFoldersFirst(nodesInFolder(nodes, currentFolderId));

  return (
    <FolderSelectField
      label="Select destination"
      field={field}
      error={error}
      current={{
        id: currentFolderId ?? "root",
        name: currentFolder?.name ?? "Documents & Files",
      }}
      onGoBack={currentFolder ? () => setLocation({ id: currentFolder.parentFolderId }) : undefined}
      nodes={children.map((child) => toFolderSelectNode(child, blockedFolderIds, setLocation))}
    />
  );
}

function toFolderSelectNode(
  child: ResourceNode,
  blockedFolderIds: Set<string>,
  setLocation: (location: { id: string | null }) => void,
): FolderSelectField.Node {
  const selectable = child.type === "folder" && Boolean(child.folderId) && !blockedFolderIds.has(child.folderId!);

  return {
    id: child.folderId ?? child.id,
    name: child.name,
    selectable,
    icon: <ResourceHubTypeIcon type={child.type} size={16} />,
    onSelect: () => setLocation({ id: child.folderId ?? null }),
  };
}
