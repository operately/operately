import React from "react";
import { SecondaryButton, PrimaryButton } from "../../Button";

interface ActionButtonsProps {
  selectedDate: Date | undefined;
  onCancel?: () => void;
  onSetDeadline?: (date: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedDate, onCancel, onSetDeadline }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      <SecondaryButton onClick={onCancel} size="sm">
        Cancel
      </SecondaryButton>
      <PrimaryButton
        onClick={() => onSetDeadline?.(selectedDate?.toISOString() || "")}
        disabled={!selectedDate}
        size="sm"
      >
        <span className="whitespace-nowrap">Set Deadline</span>
      </PrimaryButton>
    </div>
  );
};

export default ActionButtons;
