import React from "react";
import { TaskPage } from ".";
import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import Modal from "../Modal";
import { ActionConfirmation } from "../SlideIn";

export function DeleteModal(props: TaskPage.ContentState) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await props.onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  if (props.useMinimalistDelete) {
    return (
      <ActionConfirmation
        isOpen={props.isDeleteModalOpen}
        onClose={props.closeDeleteModal}
        onConfirm={handleConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete Forever"
        isConfirming={isDeleting}
      />
    );
  }

  const title = "Delete Task";

  return (
    <Modal isOpen={props.isDeleteModalOpen} onClose={props.closeDeleteModal} size="large" title={title}>
      <DeleteForm {...props} />
    </Modal>
  );
}

function DeleteForm(props: TaskPage.ContentState) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      await props.onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <WarningCallout
          message="This action cannot be undone"
          description={`Deleting a task is permanent and cannot be undone. Please confirm that you want to delete this task.`}
        />

        <div className="flex items-center gap-2">
          <DangerButton size="sm" type="submit" loading={isDeleting} disabled={isDeleting} testId="delete-task">
            Delete Forever
          </DangerButton>
          <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel-delete-task">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
