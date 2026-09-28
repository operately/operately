import { useTranslation } from "react-i18next";
import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";

interface DeleteKpiModalProps {
  kpi: SpaceKpisPage.Kpi | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (kpiId: string) => Promise<SpaceKpisPage.MutationResult>;
}

// Confirmation before deleting a KPI. Deleting removes the KPI and all of its
// recorded entries, so we guard it behind an explicit destructive confirm —
// mirroring the project delete flow.
export function DeleteKpiModal({ kpi, isOpen, onClose, onDelete }: DeleteKpiModalProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!kpi) return null;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const result = await onDelete(kpi.id);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? t("Something went wrong. Please try again."));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("Delete {{name}}", { name: kpi.name })}
      size="small"
      testId="delete-kpi-modal"
    >
      <div className="space-y-6">
        <WarningCallout
          message={t("This action cannot be undone")}
          description={t('Deleting "{{name}}" permanently removes the KPI and all of its recorded updates.', {
            name: kpi.name,
          })}
        />

        {error && (
          <div className="text-sm text-content-error" data-test-id="delete-kpi-error">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <DangerButton
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
            testId="confirm-delete-kpi"
          >
            {t("Delete forever")}
          </DangerButton>
          <SecondaryButton size="sm" onClick={onClose} testId="cancel-delete-kpi">
            {t("Cancel")}
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
