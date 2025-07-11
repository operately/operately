import React from "react";
import { SecondaryButton, PrimaryButton } from "../../Button";

interface ActionButtonsProps {
  computedDate: string;
  onCancel?: () => void;
  onSetDeadline?: (date: string) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ computedDate, onCancel, onSetDeadline }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
        <SecondaryButton onClick={onCancel} size="sm">
          Cancel
        </SecondaryButton>
        <PrimaryButton
          onClick={() => computedDate && onSetDeadline?.(computedDate)}
          disabled={!computedDate}
          size="sm"
        >
          <span className="whitespace-nowrap">Set Deadline</span>
        </PrimaryButton>

    </div>
  );
};

export default ActionButtons;
