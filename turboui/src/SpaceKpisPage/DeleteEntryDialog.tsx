import { useKpiFormatting } from "./formatting";
import React from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "../ConfirmDialog";
import { showErrorToast } from "../Toasts";
import type { SpaceKpisPage } from "./types";

interface DeleteEntryDialogProps {
  entry: SpaceKpisPage.KpiEntry | null;
  unit: string;
  onClose: () => void;
  onDelete: (entryId: string) => Promise<SpaceKpisPage.MutationResult>;
}

export function DeleteEntryDialog({ entry, unit, onClose, onDelete }: DeleteEntryDialogProps) {
  const { formatValue, formatShortDate } = useKpiFormatting();
  const { t } = useTranslation();
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
      showErrorToast(t("Update not deleted"), result.error ?? t("Something went wrong. Please try again."));
    }
  };

  return (
    <ConfirmDialog
      isOpen={entry !== null}
      onConfirm={() => void confirmDelete()}
      onCancel={onClose}
      title={t("Delete this update?")}
      message={
        entry
          ? t("{{value}} recorded on {{date}} will be permanently removed.", {
              value: formatValue(entry.value, unit),
              date: formatShortDate(entry.recordedAt),
            })
          : ""
      }
      confirmText={t("Delete update")}
      cancelText={t("Keep update")}
      variant="danger"
      size="x-small"
      testId="delete-entry-dialog"
      confirming={isDeleting}
    />
  );
}
