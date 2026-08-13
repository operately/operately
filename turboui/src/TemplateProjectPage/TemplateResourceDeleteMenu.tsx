import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { Menu, MenuActionItem } from "../Menu";
import { Modal } from "../Modal";
import { createTestId } from "../TestableElement";
import { TemplateProjectPage } from ".";

type ResourceNode = TemplateProjectPage.ResourceNode;

export function TemplateResourceDeleteMenu({
  node,
  onDelete,
}: {
  node: ResourceNode;
  onDelete: (nodeId: string) => Promise<boolean>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const closeModal = () => setIsOpen(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const deleted = await onDelete(node.id);
      if (deleted) closeModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Menu size="medium" testId={createTestId("menu", node.id)}>
        <MenuActionItem onClick={() => setIsOpen(true)} testId={createTestId("delete", node.id)} danger>
          Delete
        </MenuActionItem>
      </Menu>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <p>
          Are you sure you want to delete the {node.type} "<b>{node.name}</b>"?
        </p>
        <div className="flex items-center gap-2 mt-6">
          <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="submit">
            Delete
          </DangerButton>
          <SecondaryButton size="sm" onClick={closeModal}>
            Cancel
          </SecondaryButton>
        </div>
      </Modal>
    </>
  );
}
