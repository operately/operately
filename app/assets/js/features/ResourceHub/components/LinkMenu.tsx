import React from "react";

import * as Hub from "@/models/resourceHubs";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

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
  const [showDeleteModal, toggleDeleteModal] = useBoolState(false);

  const relevantPermissions = [permissions.canEditParentFolder, permissions.canEditLink, permissions.canDeleteLink];
  const menuId = createTestId("menu", link.id!);

  if (!relevantPermissions.some(Boolean)) return <></>;

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

function EditLinkMenuItem({ link }: Props) {
  const paths = usePaths();
  const editPath = paths.resourceHubEditLinkPath(link.id!);
  const editId = createTestId("edit", link.id!);

  return (
    <MenuLinkItem to={editPath} testId={editId}>
      Edit
    </MenuLinkItem>
  );
}

interface DeleteLinkMenuItemProps {
  link: Hub.ResourceHubLink;
  toggleDeleteModal: () => void;
}

function DeleteLinkMenuItem({ link, toggleDeleteModal }: DeleteLinkMenuItemProps) {
  const deleteId = createTestId("delete", link.id!);

  return (
    <MenuActionItem onClick={toggleDeleteModal} testId={deleteId} danger>
      Delete
    </MenuActionItem>
  );
}

interface DeleteLinkModalProps {
  link: Hub.ResourceHubLink;
  isOpen: boolean;
  hideModal: () => void;
}

function DeleteLinkModal({ link, isOpen, hideModal }: DeleteLinkModalProps) {
  const { refetch } = useNodesContext();
  const [remove] = Hub.useDeleteResourceHubLink();

  const handleDelete = async () => {
    await remove({ linkId: link.id });
    refetch();
    hideModal();
  };

  const form = Forms.useForm({
    fields: {},
    cancel: hideModal,
    submit: handleDelete,
  });

  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <p>
          Are you sure you want to delete the link "<b>{link.name}</b>"?
        </p>
        <Forms.Submit saveText="Delete" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
