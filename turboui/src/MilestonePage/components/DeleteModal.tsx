import { useTranslation } from "react-i18next";
import React from "react";
import type { MilestonePage } from "../types";
import { DangerButton, SecondaryButton } from "../../Button";
import { WarningCallout } from "../../Callouts";
import Modal from "../../Modal";

export function DeleteModal(props: Pick<MilestonePage.State, "isDeleteModalOpen" | "closeDeleteModal" | "onDelete">) {
  const { t } = useTranslation();
  const title = t("Delete Milestone");

  return (
    <Modal isOpen={props.isDeleteModalOpen} onClose={props.closeDeleteModal} size="large" title={title}>
      <DeleteForm {...props} />
    </Modal>
  );
}

function DeleteForm(props: Pick<MilestonePage.State, "onDelete" | "closeDeleteModal">) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      if (props.onDelete) {
        props.onDelete();
      }
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
            "Deleting a milestone is permanent and cannot be undone. Please confirm that you want to delete this milestone.",
          )}
        />

        <div className="flex items-center gap-2">
          <DangerButton size="sm" type="submit" loading={isDeleting} disabled={isDeleting} testId="delete-milestone">
            {t("Delete Forever")}
          </DangerButton>
          <SecondaryButton size="sm" onClick={props.closeDeleteModal} testId="cancel-delete-milestone">
            {t("Cancel")}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
