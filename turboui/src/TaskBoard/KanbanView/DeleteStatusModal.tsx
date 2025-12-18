import React from "react";
import { Modal } from "../../Modal";
import { DangerButton, SecondaryButton } from "../../Button";
import { StatusSelector } from "../../StatusSelector";

interface DeleteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusSelector.StatusOption;
  isLastStatus: boolean;
  statuses: StatusSelector.StatusOption[];
  onConfirm: (replacementStatusId: string) => void;
}

export function DeleteStatusModal({ isOpen, onClose, status, isLastStatus, statuses, onConfirm }: DeleteStatusModalProps) {
  const [replacementStatusId, setReplacementStatusId] = React.useState<string>("");
  const [showValidation, setShowValidation] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setReplacementStatusId("");
      setShowValidation(false);
    }
  }, [isOpen]);

  const replacementOptions = React.useMemo(
    () => statuses.filter((s) => s.id !== status.id && s.value !== "unknown-status"),
    [statuses, status.id],
  );

  const replacementStatus = React.useMemo(
    () => replacementOptions.find((s) => s.id === replacementStatusId) ?? null,
    [replacementOptions, replacementStatusId],
  );

  if (isLastStatus) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Delete Status" testId={"delete-status-modal"}>
        <div className="space-y-4">
          <div className="text-content-base">
            This status cannot be deleted. The Kanban board must have at least one status.
          </div>
          <div className="flex justify-end pt-2">
            <SecondaryButton onClick={onClose} testId="delete-status-cancel">
              Close
            </SecondaryButton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Status" testId={"delete-status-modal"}>
      <div className="space-y-4">
        <div className="text-content-base">
          To delete the <strong>{status.label}</strong> status, select a replacement status. All tasks
          currently in <strong>{status.label}</strong> will be moved to the replacement status.
        </div>

        <div className="flex items-center gap-2">
          <StatusSelector
            statusOptions={replacementOptions}
            status={replacementStatus}
            onChange={(s) => setReplacementStatusId(s.id)}
            showFullBadge
            testId={`deleted-status-replacement-${status.id}`}
          />

          {showValidation && replacementStatusId.length === 0 && (
            <span className="text-xs text-content-error" data-test-id="missing-replacement">
              Required
            </span>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton onClick={onClose} testId="delete-status-cancel">
            Cancel
          </SecondaryButton>
          <DangerButton
            onClick={() => {
              if (replacementStatusId.length === 0) {
                setShowValidation(true);
                return;
              }

              onConfirm(replacementStatusId);
            }}
            testId="delete-status-confirm"
          >
            Delete Status
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}
