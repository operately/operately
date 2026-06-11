import * as React from "react";

import { DangerButton, SecondaryButton } from "../../Button";
import { Menu, MenuActionItem, MenuLinkItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { ResourceHubLinkMenuData } from "../types";
import { MoveResourceMenuItem, MoveResourceModal } from "./MoveResource";

interface LinkMenuProps {
  link: ResourceHubLinkMenuData;
}

export function LinkMenu({ link }: LinkMenuProps) {
  const { permissions } = useResourceHubNodesListContext();
  const [showMoveForm, setShowMoveForm] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const toggleMoveForm = () => setShowMoveForm((value) => !value);
  const toggleDeleteModal = () => setShowDeleteModal((value) => !value);

  if (!permissions) return null;

  const relevantPermissions = [permissions.canEditParentFolder, permissions.canEditLink, permissions.canDeleteLink];
  const menuId = createTestId("menu", link.id);

  if (!relevantPermissions.some(Boolean)) return null;

  return (
    <>
      <Menu size="medium" testId={menuId}>
        {permissions.canEditParentFolder && <MoveResourceMenuItem resource={link} showModal={toggleMoveForm} />}
        {permissions.canEditLink && <EditLinkMenuItem link={link} />}
        {permissions.canDeleteLink && <DeleteLinkMenuItem link={link} toggleDeleteModal={toggleDeleteModal} />}
      </Menu>

      <MoveResourceModal resource={link} resourceType="link" isOpen={showMoveForm} hideModal={toggleMoveForm} />
      <DeleteLinkModal link={link} isOpen={showDeleteModal} hideModal={toggleDeleteModal} />
    </>
  );
}

function EditLinkMenuItem({ link }: LinkMenuProps) {
  const { paths } = useResourceHubNodesListContext();

  if (!paths) return null;

  const editPath = paths.editLinkPath(link.id);
  const editId = createTestId("edit", link.id);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

function DeleteLinkMenuItem({ link, toggleDeleteModal }: { link: ResourceHubLinkMenuData; toggleDeleteModal: () => void }) {
  const deleteId = createTestId("delete", link.id);

  return (
    <MenuActionItem onClick={toggleDeleteModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

function DeleteLinkModal({ link, isOpen, hideModal }: { link: ResourceHubLinkMenuData; isOpen: boolean; hideModal: () => void }) {
  const { onRefetch, actions } = useResourceHubNodesListContext();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    const deleteLink = actions.deleteLink;

    if (!deleteLink) return;

    setIsDeleting(true);
    try {
      await deleteLink(link.id);
      onRefetch?.();
      hideModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={hideModal}>
      <p>
        Are you sure you want to delete the link "<b>{link.name}</b>"?
      </p>
      <div className="flex items-center gap-2 mt-6">
        <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="submit">
          Delete
        </DangerButton>
        <SecondaryButton size="sm" onClick={hideModal}>
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
}
