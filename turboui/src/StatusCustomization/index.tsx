import React from "react";
import { Modal } from "../Modal";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconPlus } from "../icons";
import { StatusSelector } from "../StatusSelector";
import { useSortableList } from "../utils/PragmaticDragAndDrop";
import { DeletedStatusRow } from "./components/DeletedStatusRow";
import { StatusRow, applyStatusUpdate } from "./components/StatusRow";
import { useDraftStatuses, useStatusSaving } from "./hooks";
import { buildStatus } from "./utils";

export interface StatusCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: ReadonlyArray<StatusSelector.StatusOption>;
  requireReplacement?: boolean;
  onSave: (data: {
    nextStatuses: StatusSelector.StatusOption[];
    deletedStatusReplacements: Record<string, string>;
  }) => void;
  title?: string;
}

export function StatusCustomizationModal({
  isOpen,
  onClose,
  statuses,
  requireReplacement = false,
  onSave,
  title = "Customize statuses",
}: StatusCustomizationModalProps) {
  const [draftStatuses, setDraftStatuses] = useDraftStatuses(statuses, isOpen);
  const [deletedStatuses, setDeletedStatuses] = React.useState<StatusSelector.StatusOption[]>([]);
  const [deletedStatusReplacements, setDeletedStatusReplacements] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setDeletedStatuses([]);
      setDeletedStatusReplacements({});
    }
  }, [isOpen]);

  const { sanitizedStatuses, showValidation, handleSave } = useStatusSaving(
    draftStatuses,
    deletedStatuses,
    deletedStatusReplacements,
    onSave,
    isOpen,
    requireReplacement,
  );

  const fallbackReplacementOption = sanitizedStatuses[0];

  const updateStatus = (id: string, updates: Partial<StatusSelector.StatusOption>) => {
    setDraftStatuses((prev) =>
      prev.map((status) => {
        if (status.id !== id) return status;

        return applyStatusUpdate(status, updates);
      }),
    );
  };

  const removeStatus = (id: string) => {
    setDraftStatuses((prev) => {
      if (prev.length <= 1) return prev;

      const status = prev.find((s) => s.id === id);
      if (requireReplacement && status && !status.isNew) {
        setDeletedStatuses((prevDeleted) => [...prevDeleted, status]);
        setDeletedStatusReplacements((prevReplacements) => {
          const next = { ...prevReplacements };
          delete next[id];
          return next;
        });
      }

      const remaining = prev.filter((s) => s.id !== id);
      return remaining.map((status, index) => ({ ...status, index }));
    });
  };

  const restoreDeletedStatus = (id: string) => {
    setDeletedStatuses((prevDeleted) => {
      const restored = prevDeleted.find((s) => s.id === id);
      if (!restored) return prevDeleted;

      setDraftStatuses((prev) => [...prev, { ...restored, index: prev.length }]);
      setDeletedStatusReplacements((prevReplacements) => {
        const next = { ...prevReplacements };
        delete next[id];
        return next;
      });

      return prevDeleted.filter((s) => s.id !== id);
    });
  };

  const addStatus = () => {
    setDraftStatuses((prev) => [...prev, buildStatus(undefined, prev.length, true)]);
  };

  const handleReorder = (itemId: string, newIndex: number) => {
    setDraftStatuses((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === itemId);
      if (oldIndex === -1) return prev;

      const reordered = [...prev];
      const [moved] = reordered.splice(oldIndex, 1);
      if (!moved) return prev;

      reordered.splice(newIndex, 0, moved);

      return reordered.map((status, index) => ({ ...status, index }));
    });
  };

  useSortableList(draftStatuses, handleReorder);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
      contentPadding="p-0"
      testId="status-customization-modal"
    >
      <div className="p-6 space-y-4">
        <p className="text-sm text-content-dimmed">
          Add, edit, or remove task statuses. Click the icon to change the color and appearance.
        </p>

        <div className="space-y-3">
          {draftStatuses.map((status, index) => {
            const isLabelInvalid = showValidation && sanitizedStatuses[index]?.label.length === 0;
            return (
              <StatusRow
                key={status.id}
                status={status}
                isLabelInvalid={isLabelInvalid}
                onUpdate={updateStatus}
                onRemove={removeStatus}
                canRemove={draftStatuses.length > 1}
                index={index}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={addStatus}
          className="w-full rounded-lg border border-dashed border-surface-outline py-2 text-sm font-medium text-content-dimmed transition hover:text-brand-1 hover:border-brand-1/50 flex items-center justify-center gap-2"
          data-test-id="add-status-button"
        >
          <IconPlus size={14} />
          Add status
        </button>

        {requireReplacement && deletedStatuses.length > 0 && fallbackReplacementOption && (
          <div className="pt-4 mt-4 border-t border-surface-outline">
            <h3 className="text-sm font-semibold text-content-base">Deleted statuses</h3>
            <p className="text-xs text-content-dimmed mt-1">
              Select a replacement status for each deleted status. Tasks using deleted statuses will be moved to the
              selected replacements.
            </p>

            <div className="space-y-3 mt-3" data-test-id="deleted-statuses-section">
              {deletedStatuses.map((deletedStatus, index) => {
                const replacementId = deletedStatusReplacements[deletedStatus.id] ?? "";
                const replacementStatus = sanitizedStatuses.find((s) => s.id === replacementId) ?? null;

                return (
                  <DeletedStatusRow
                    key={deletedStatus.id}
                    deletedStatus={deletedStatus}
                    index={index}
                    sanitizedStatuses={sanitizedStatuses}
                    replacementStatus={replacementStatus}
                    isReplacementMissing={replacementId.length === 0}
                    onSelectReplacement={(status) => {
                      setDeletedStatusReplacements((prev) => ({ ...prev, [deletedStatus.id]: status.id }));
                    }}
                    onRestore={() => restoreDeletedStatus(deletedStatus.id)}
                    showValidation={showValidation}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-6 py-4 border-t border-surface-outline">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave}>
            Save changes
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
