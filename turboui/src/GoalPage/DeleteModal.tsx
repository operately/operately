import { useTranslation } from "react-i18next";
import React from "react";
import { GoalPage } from ".";
import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import { MiniWorkMap } from "../MiniWorkMap";
import Modal from "../Modal";

export function DeleteModal(props: GoalPage.State) {
  const { t } = useTranslation();
  const title =
    props.relatedWorkItems.length > 0
      ? t("Cannot delete goal")
      : t("Delete {{goalName}}", { goalName: props.goalName });

  return (
    <Modal isOpen={props.isDeleteModalOpen} onClose={props.closeDeleteModal} size="large" title={title}>
      {props.relatedWorkItems.length > 0 ? <CantDeleteHasSubitems {...props} /> : <DeleteForm {...props} />}
    </Modal>
  );
}

function CantDeleteHasSubitems(props: GoalPage.State) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="mb-6">
        {t(
          "You need to delete all subgoals and projects before you can delete this goal. The following items are connected to this goal and must be deleted first:",
        )}
      </p>

      <MiniWorkMap items={props.relatedWorkItems} />

      <div className="flex items-center gap-2 mt-8">
        <DangerButton size="sm" disabled testId="delete">
          {t("Delete Forever")}
        </DangerButton>
        <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel">
          {t("Cancel")}
        </SecondaryButton>
      </div>
    </div>
  );
}

function DeleteForm(props: GoalPage.State) {
  const { t } = useTranslation();
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
          message={t("This action cannot be undone")}
          description={t(
            "Deleting a goal is permanent and cannot be undone. Please confirm that you want to delete the {{goalName}} goal.",
            { goalName: props.goalName },
          )}
        />

        <div className="flex items-center gap-2">
          <DangerButton size="sm" type="submit" loading={isDeleting} disabled={isDeleting} testId="delete">
            {t("Delete Forever")}
          </DangerButton>
          <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel">
            {t("Cancel")}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
