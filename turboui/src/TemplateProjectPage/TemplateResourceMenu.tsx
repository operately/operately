import React from "react";

import { Menu, MenuActionItem } from "../Menu";
import { DeleteResourceConfirmModal } from "../ResourceHub/DeleteResourceConfirmModal";
import { createTestId } from "../TestableElement";
import type { TemplateProjectPage } from ".";
import { TemplateMoveResourceModal } from "./TemplateMoveResourceModal";

type ResourceNode = TemplateProjectPage.ResourceNode;

export function TemplateResourceMenu({
  node,
  resourceNodes,
  currentFolderId,
  onMove,
  onDelete,
}: {
  node: ResourceNode;
  resourceNodes: ResourceNode[];
  currentFolderId: string | null;
  onMove?: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
  onDelete?: (nodeId: string) => Promise<boolean>;
}) {
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!onMove && !onDelete) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    const deleted = await onDelete(node.id);
    if (deleted) setShowDeleteConfirm(false);
  };

  return (
    <>
      <Menu size="medium" testId={createTestId("menu", node.id)}>
        {onMove && (
          <MenuActionItem onClick={() => setShowMoveForm(true)} testId={createTestId("move", node.id)}>
            Move
          </MenuActionItem>
        )}
        {onDelete && (
          <MenuActionItem onClick={() => setShowDeleteConfirm(true)} testId={createTestId("delete", node.id)} danger>
            Delete
          </MenuActionItem>
        )}
      </Menu>
      {onMove && showMoveForm && (
        <TemplateMoveResourceModal
          node={node}
          resourceNodes={resourceNodes}
          currentFolderId={currentFolderId}
          isOpen
          hideModal={() => setShowMoveForm(false)}
          onMove={onMove}
        />
      )}
      {onDelete && (
        <DeleteResourceConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          resourceType={node.type}
          resourceName={node.name}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
