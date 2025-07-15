import React from "react";
import { SecondaryButton, PrimaryButton } from "../../Button";

interface ActionButtonsProps {
  selectedDate: Date | undefined;
  onCancel?: () => void;
  onSetDeadline?: (date: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedDate, onCancel, onSetDeadline }) => {
  const handleCancel = () => {
    // Call the onCancel handler which should close the popover and revert the date
    onCancel?.();
  };

  const handleConfirm = () => {
    // Only call onSetDeadline if we have a valid selectedDate
    if (selectedDate) {
      onSetDeadline?.(selectedDate.toISOString());
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      <SecondaryButton onClick={handleCancel} size="sm">
        Cancel
      </SecondaryButton>
      <PrimaryButton onClick={handleConfirm} disabled={!selectedDate} size="sm">
        <span className="whitespace-nowrap">Set Deadline</span>
      </PrimaryButton>
    </div>
  );
};

export default ActionButtons;
