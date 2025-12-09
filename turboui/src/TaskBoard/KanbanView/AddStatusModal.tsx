import React from "react";

import { Modal } from "../../Modal";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { IconPlus } from "../../icons";
import { StatusSelector } from "../../StatusSelector";
import {
  StatusAppearance,
  StatusAppearancePicker,
  STATUS_APPEARANCES,
} from "../../StatusCustomization/StatusAppearancePicker";
import { createTestId } from "../../TestableElement";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingStatuses: StatusSelector.StatusOption[];
  statusToEdit?: StatusSelector.StatusOption;
  onStatusCreated: (status: StatusSelector.StatusOption) => void;
  onStatusUpdated: (status: StatusSelector.StatusOption) => void;
}

export function AddStatusModal({
  isOpen,
  onClose,
  existingStatuses,
  statusToEdit,
  onStatusCreated,
  onStatusUpdated,
}: Props) {
  const [label, setLabel] = React.useState("");
  const [appearance, setAppearance] = React.useState<StatusAppearance>("gray");

  React.useEffect(() => {
    if (isOpen) {
      if (statusToEdit) {
        setLabel(statusToEdit.label);
        setAppearance(
          (Object.keys(STATUS_APPEARANCES).find(
            (key) =>
              STATUS_APPEARANCES[key as StatusAppearance].color === statusToEdit.color &&
              STATUS_APPEARANCES[key as StatusAppearance].icon === statusToEdit.icon,
          ) as StatusAppearance) || "gray",
        );
      } else {
        setLabel("");
        setAppearance("gray");
      }
    }
  }, [isOpen, statusToEdit]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      const trimmedLabel = label.trim();
      if (!trimmedLabel) return;

      const nextIndex =
        existingStatuses.length === 0
          ? 0
          : (existingStatuses[existingStatuses.length - 1]?.index ?? existingStatuses.length - 1) + 1;

      const valueBase = generateStatusValueFromLabel(trimmedLabel);
      const existingValues = new Set(existingStatuses.map((status) => status.value));
      let value = valueBase;
      let suffix = 1;

      while (existingValues.has(value)) {
        value = `${valueBase}_${suffix}`;
        suffix += 1;
      }

      const preset = STATUS_APPEARANCES[appearance];

      if (statusToEdit) {
        const updatedStatus: StatusSelector.StatusOption = {
          ...statusToEdit,
          label: trimmedLabel,
          // Keep value stable to avoid breaking kanban state mapping.
          color: preset.color,
          icon: preset.icon,
          closed: appearance === "green" || appearance === "red",
        };
        onStatusUpdated(updatedStatus);
      } else {
        const status: StatusSelector.StatusOption = {
          id: generateId(),
          label: trimmedLabel,
          value,
          color: preset.color,
          icon: preset.icon,
          index: nextIndex,
          closed: appearance === "green" || appearance === "red",
        };
        onStatusCreated(status);
      }
      onClose();
    },
    [appearance, existingStatuses, label, onClose, onStatusCreated, onStatusUpdated, statusToEdit],
  );

  const isEditing = Boolean(statusToEdit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit status" : "Add status"}
      size="small"
      testId={createTestId("status-modal", isEditing ? "edit" : "add")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-content-base">Name</label>
          <div className="flex items-center gap-2">
            <StatusAppearancePicker
              value={appearance}
              onChange={setAppearance}
              testId={"status-appearance-trigger"}
            />
            <div className="flex-1 flex items-center gap-2 rounded-lg border border-surface-outline bg-surface-base px-3 py-1.5">
              <input
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Status name"
                className="flex-1 bg-transparent border-none outline-none text-sm text-content-base placeholder:text-content-dimmed"
                data-test-id={"status-name-input"}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButton type="button" onClick={onClose} testId={"status-cancel"}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            icon={!isEditing && IconPlus}
            disabled={label.trim().length === 0}
            testId={"status-save"}
          >
            {isEditing ? "Save changes" : "Add status"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
function generateStatusValueFromLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_");
}

function generateId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `status-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
