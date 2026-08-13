import React from "react";

import { Menu, MenuActionItem } from "../Menu";
import { DeleteResourceConfirmModal } from "../ResourceHub/DeleteResourceConfirmModal";
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
  const closeModal = () => setIsOpen(false);

  const handleDelete = async () => {
    const deleted = await onDelete(node.id);
    if (deleted) closeModal();
  };

  return (
    <>
      <Menu size="medium" testId={createTestId("menu", node.id)}>
        <MenuActionItem onClick={() => setIsOpen(true)} testId={createTestId("delete", node.id)} danger>
          Delete
        </MenuActionItem>
      </Menu>
      <DeleteResourceConfirmModal
        isOpen={isOpen}
        onClose={closeModal}
        resourceType={node.type}
        resourceName={node.name}
        onConfirm={handleDelete}
      />
    </>
  );
}
