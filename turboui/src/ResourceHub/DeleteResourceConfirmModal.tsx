import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { Modal } from "../Modal";

export function DeleteResourceConfirmModal({
  isOpen,
  onClose,
  resourceType,
  resourceName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceName: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p>
        Are you sure you want to delete the {resourceType} "<b>{resourceName}</b>"?
      </p>
      <div className="flex items-center gap-2 mt-6">
        <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="submit">
          Delete
        </DangerButton>
        <SecondaryButton size="sm" onClick={onClose}>
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
}
