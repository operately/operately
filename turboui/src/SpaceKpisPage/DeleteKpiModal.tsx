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

  // Called after a successful delete so the page can leave the (now missing)
  // detail view and return to the list.
  onDeleted?: () => void;
}

// Confirmation before deleting a KPI. Deleting removes the KPI and all of its
// recorded entries, so we guard it behind an explicit destructive confirm —
// mirroring the project delete flow.
export function DeleteKpiModal({ kpi, isOpen, onClose, onDelete, onDeleted }: DeleteKpiModalProps) {
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
        onDeleted?.();
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${kpi.name}`} size="small" testId="delete-kpi-modal">
      <div className="space-y-6">
        <WarningCallout
          message="This action cannot be undone"
          description={`Deleting "${kpi.name}" permanently removes the KPI and all of its recorded updates.`}
        />

        {error && (
          <div className="text-sm text-content-error" data-test-id="delete-kpi-error">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="confirm-delete-kpi">
            Delete forever
          </DangerButton>
          <SecondaryButton size="sm" onClick={onClose} testId="cancel-delete-kpi">
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
