import React from "react";
import { Modal } from "../../Modal";
import { DangerButton, SecondaryButton } from "../../Button";
import { StatusSelector } from "../../StatusSelector";

interface DeleteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusSelector.StatusOption;
  hasTasks: boolean;
  onConfirm: () => void;
}

export function DeleteStatusModal({ isOpen, onClose, status, hasTasks, onConfirm }: DeleteStatusModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Status">
      <div className="space-y-4">
        {hasTasks ? (
          <div className="text-content-base">
            This status cannot be deleted because it contains tasks. Please move or delete the tasks before deleting the
            status.
          </div>
        ) : (
          <div className="text-content-base">
            Are you sure you want to delete the <strong>{status.label}</strong> status?
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          {!hasTasks && <DangerButton onClick={onConfirm}>Delete Status</DangerButton>}
        </div>
      </div>
    </Modal>
  );
}
