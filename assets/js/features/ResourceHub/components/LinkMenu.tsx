import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Pages from "@/components/Pages";

import { useBoolState } from "@/hooks/useBoolState";
import { useNodesContext } from "@/features/ResourceHub";
import { Menu, MenuActionItem, MenuLinkItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { Paths } from "@/routes/paths";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";
import { DecoratedNode } from "../DecoratedNode";

interface Props {
  node: DecoratedNode;
}

export function LinkMenu({ node }: Props) {
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [
    node.permissions.canEditParentFolder,
    node.permissions.canEditLink,
    node.permissions.canDeleteLink,
  ];

  const menuId = createTestId("link-menu", node.resource.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {node.permissions.canEditParentFolder && <MoveResourceMenuItem node={node} showModal={toggleMoveForm} />}
        {node.permissions.canEditLink && <EditLinkMenuItem node={node} />}
        {node.permissions.canDeleteLink && <DeleteLinkMenuItem node={node} />}
      </Menu>

      <MoveResourceModal node={node} isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function EditLinkMenuItem({ node }: Props) {
  const editPath = Paths.resourceHubEditLinkPath(node.resource.id!);
  const editId = createTestId("edit", node.resource.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteLinkMenuItem({ node }: Props) {
  const refresh = Pages.useRefresh();
  const [remove] = Hub.useDeleteResourceHubLink();

  const handleDelete = async () => {
    await remove({ linkId: node.resource.id });
    refresh();
  };

  const deleteId = createTestId("delete", node.resource.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
