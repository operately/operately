import React from "react";
import { GoalPage } from ".";
import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import { MiniWorkMap } from "../MiniWorkMap";
import Modal from "../Modal";

export function DeleteModal(props: GoalPage.State) {
  const title = props.relatedWorkItems.length > 0 ? "Cannot delete goal" : "Delete " + props.goalName;

  return (
    <Modal isOpen={props.isDeleteModalOpen} onClose={props.closeDeleteModal} size="large" title={title}>
      {props.relatedWorkItems.length > 0 ? <CantDeleteHasSubitems {...props} /> : <DeleteForm {...props} />}
    </Modal>
  );
}

function CantDeleteHasSubitems(props: GoalPage.State) {
  return (
    <div>
      <p className="mb-6">
        You need to delete all subgoals and projects before you can delete this goal. The following items are connected
        to this goal and must be deleted first:
      </p>

      <MiniWorkMap items={props.relatedWorkItems} />

      <div className="flex items-center gap-2 mt-8">
        <DangerButton size="sm" disabled testId="delete">
          Delete Forever
        </DangerButton>
        <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel">
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

function DeleteForm(props: GoalPage.State) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      await props.deleteGoal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <WarningCallout
          message="This action cannot be undone"
          description={`Deleting a goal is permanent and cannot be undone. Please confirm that you want to delete the ${props.goalName} goal.`}
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
