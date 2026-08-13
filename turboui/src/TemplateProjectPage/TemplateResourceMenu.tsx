import React from "react";

import { Menu, MenuActionItem } from "../Menu";
import { DeleteResourceConfirmModal } from "../ResourceHub/DeleteResourceConfirmModal";
import { RenameFolderModal } from "../ResourceHub/nodeMenus/FolderMenu";
import { createTestId } from "../TestableElement";
import type { TemplateProjectPage } from ".";
import { TemplateMoveResourceModal } from "./TemplateMoveResourceModal";

type ResourceNode = TemplateProjectPage.ResourceNode;

export function TemplateResourceMenu({
  node,
  resourceNodes,
  currentFolderId,
  onRename,
  onMove,
  onDelete,
}: {
  node: ResourceNode;
  resourceNodes: ResourceNode[];
  currentFolderId: string | null;
  onRename?: (folderId: string, name: string) => Promise<boolean>;
  onMove?: (nodeId: string, parentFolderId: string | null) => Promise<boolean>;
  onDelete?: (nodeId: string) => Promise<boolean>;
}) {
  const [showRenameForm, setShowRenameForm] = React.useState(false);
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const canRename = Boolean(node.type === "folder" && node.folderId && onRename);

  if (!canRename && !onMove && !onDelete) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    const deleted = await onDelete(node.id);
    if (deleted) setShowDeleteConfirm(false);
  };

  const handleRename = async (folderId: string, name: string) => {
    if (!onRename) return;
    return onRename(folderId, name);
  };

  return (
    <>
      <Menu size="medium" testId={createTestId("menu", node.id)}>
        {canRename && (
          <MenuActionItem
            onClick={() => setShowRenameForm(true)}
            testId={createTestId("rename-folder", node.folderId!)}
          >
            Rename
          </MenuActionItem>
        )}
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
      {canRename && (
        <RenameFolderModal
          folder={{ id: node.folderId!, name: node.name }}
          showForm={showRenameForm}
          toggleForm={() => setShowRenameForm((open) => !open)}
          onSave={() => undefined}
          onRename={handleRename}
          key={node.name}
        />
      )}
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
