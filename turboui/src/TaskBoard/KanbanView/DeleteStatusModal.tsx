import React from "react";
import { Modal } from "../../Modal";
import { DangerButton, SecondaryButton } from "../../Button";
import { StatusSelector } from "../../StatusSelector";

interface DeleteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusSelector.StatusOption;
  hasTasks: boolean;
  isLastStatus: boolean;
  onConfirm: () => void;
}

export function DeleteStatusModal({ isOpen, onClose, status, hasTasks, isLastStatus, onConfirm }: DeleteStatusModalProps) {
  let message: React.ReactNode;
  const canDelete = !hasTasks && !isLastStatus;

  if (isLastStatus) {
    message = "This status cannot be deleted. The Kanban board must have at least one status.";
  } else if (hasTasks) {
    message =
      "This status cannot be deleted because it contains tasks. Please move or delete the tasks before deleting the status.";
  } else {
    message = (
      <>
        Are you sure you want to delete the <strong>{status.label}</strong> status?
      </>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Status">
      <div className="space-y-4">
        <div className="text-content-base">{message}</div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          {canDelete && <DangerButton onClick={onConfirm}>Delete Status</DangerButton>}
        </div>
      </div>
    </Modal>
  );
}
