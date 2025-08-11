import React from "react";
import { ProjectPage } from ".";
import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import Modal from "../Modal";

export function DeleteModal(props: ProjectPage.State) {
  const title = "Delete " + props.projectName;

  return (
    <Modal isOpen={props.isDeleteModalOpen} onClose={props.closeDeleteModal} size="large" title={title}>
      <DeleteForm {...props} />
    </Modal>
  );
}

function DeleteForm(props: ProjectPage.State) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      await props.onProjectDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <WarningCallout
          message="This action cannot be undone"
          description={`Deleting a project is permanent and cannot be undone. Please confirm that you want to delete the ${props.projectName} project.`}
        />

        <div className="flex items-center gap-2">
          <DangerButton size="sm" type="submit" loading={isDeleting} disabled={isDeleting} testId="delete">
            Delete Forever
          </DangerButton>
          <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
