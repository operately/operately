import React from "react";

import { ConfirmDialog } from "../ConfirmDialog";
import { showErrorToast } from "../Toasts";
import type { SpaceKpisPage } from "./types";
import { formatShortDate, formatValue } from "./utils";

interface DeleteEntryDialogProps {
  entry: SpaceKpisPage.KpiEntry | null;
  unit: string;
  onClose: () => void;
  onDelete: (entryId: string) => Promise<SpaceKpisPage.MutationResult>;
}

export function DeleteEntryDialog({ entry, unit, onClose, onDelete }: DeleteEntryDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!entry) setIsDeleting(false);
  }, [entry]);

  const confirmDelete = async () => {
    if (!entry || isDeleting) return;

    setIsDeleting(true);
    const result = await onDelete(entry.id);
    setIsDeleting(false);

    if (result.success) {
      onClose();
    } else {
      showErrorToast("Update not deleted", result.error ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <ConfirmDialog
      isOpen={entry !== null}
      onConfirm={() => void confirmDelete()}
      onCancel={onClose}
      title="Delete this update?"
      message={
        entry
          ? `${formatValue(entry.value, unit)} recorded on ${formatShortDate(entry.recordedAt)} will be permanently removed.`
          : ""
      }
      confirmText="Delete update"
      cancelText="Keep update"
      variant="danger"
      size="x-small"
      testId="delete-entry-dialog"
      confirming={isDeleting}
    />
  );
}
