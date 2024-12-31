import React from "react";

import * as Hub from "@/models/resourceHubs";

import { useBoolState } from "@/hooks/useBoolState";
import { Menu, MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResources";

interface Props {
  link: Hub.ResourceHubLink;
}

export function LinkMenu({ link }: Props) {
  const { permissions } = useNodesContext();
  const [showMoveForm, toggleMoveForm] = useBoolState(false);

  const relevantPermissions = [permissions.canEditParentFolder, permissions.canDeleteLink];
  const menuId = createTestId("link-menu", link.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={link} showModal={toggleMoveForm} />}
        {permissions.canDeleteLink && <DeleteLinkMenuItem link={link} />}
      </Menu>

      <MoveResourceModal resource={link} resourceType="link" isOpen={showMoveForm} hideModal={toggleMoveForm} />
    </>
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
