import React from "react";

import * as Hub from "@/models/resourceHubs";

import { useNodesContext } from "@/features/ResourceHub";
import { useBoolState } from "@/hooks/useBoolState";
import { createTestId } from "@/utils/testid";
import { Menu, MenuActionItem, MenuLinkItem } from "turboui";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

import { usePaths } from "@/routes/paths";
interface Props {
  link: Hub.ResourceHubLink;
}

export function LinkMenu({ link }: Props) {
  const { permissions } = useNodesContext();
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [permissions.canEditParentFolder, permissions.canEditLink, permissions.canDeleteLink];
  const menuId = createTestId("menu", link.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={link} showModal={toggleMoveForm} />}
        {permissions.canEditLink && <EditLinkMenuItem link={link} />}
        {permissions.canDeleteLink && <DeleteLinkMenuItem link={link} />}
      </Menu>

      <MoveResourceModal resource={link} resourceType="link" isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
  );
}

function EditLinkMenuItem({ link }: Props) {
  const editPath = paths.resourceHubEditLinkPath(link.id!);
  const editId = createTestId("edit", link.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteLinkMenuItem({ link }: Props) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubLink();

  const handleDelete = async () => {
    await remove({ linkId: link.id });
    refetch();
  };
  const deleteId = createTestId("delete", link.id!);

  return (
    <MenuActionItem onClick={handleDelete} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}
