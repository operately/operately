import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { Paths } from "@/routes/paths";
import { createTestId } from "@/utils/testid";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";
import { CopyResourceMenuItem, CopyResourceModal } from "./CopyResources";
import { DecoratedNode } from "../DecoratedNode";

interface Props {
  node: DecoratedNode;
}

export function DocumentMenu({ node }: Props) {
  const [showMoveForm, toggleMoveForm] = useBoolState(false);
  const [showCopyForm, toggleCopyForm] = useBoolState(false);

  const relevantPermissions = [
    node.permissions.canEditDocument,
    node.permissions.canCreateDocument,
    node.permissions.canEditParentFolder,
    node.permissions.canDeleteDocument,
  ];

  const menuId = createTestId("document-menu", node.resource.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {node.permissions.canEditDocument && <EditDocumentMenuItem node={node} />}
        {node.permissions.canCreateDocument && <CopyResourceMenuItem node={node} showModal={toggleCopyForm} />}
        {node.permissions.canEditParentFolder && <MoveResourceMenuItem node={node} showModal={toggleMoveForm} />}
        {node.permissions.canDeleteDocument && <DeleteDocumentMenuItem node={node} />}
      </Menu>

      <MoveResourceModal node={node} isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <CopyResourceModal node={node} isOpen={showCopyForm} hideModal={toggleCopyForm} />
    </>
  );
}

function EditDocumentMenuItem({ node }: Props) {
  const editPath = Paths.resourceHubEditDocumentPath(node.resource.id!);
  const editId = createTestId("edit", node.resource.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteDocumentMenuItem({ node }: Props) {
  const refresh = Pages.useRefresh();
  const [remove] = Hub.useDeleteResourceHubDocument();

  const handleDelete = async () => {
    await remove({ documentId: node.resource.id });
    refresh();
  };
  const deleteId = createTestId("delete", node.resource.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
