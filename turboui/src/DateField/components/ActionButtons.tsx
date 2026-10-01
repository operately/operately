import React from "react";
import { useTranslation } from "react-i18next";
import { DateField } from "../index";
import { SecondaryButton, PrimaryButton } from "../../Button";

interface ActionButtonsProps {
  selectedDate: DateField.ContextualDate | null;
  onCancel?: () => void;
  onSetDeadline?: (selectedDate: DateField.ContextualDate | null) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ selectedDate, onCancel, onSetDeadline }) => {
  const { t } = useTranslation();
  const handleConfirm = () => {
    if (selectedDate) {
      onSetDeadline?.(selectedDate);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      <SecondaryButton onClick={() => onCancel?.()} size="sm" testId="date-field-cancel">
        {t("Cancel")}
      </SecondaryButton>
      <PrimaryButton onClick={handleConfirm} disabled={!selectedDate} size="sm" testId="date-field-confirm">
        <span className="whitespace-nowrap">{t("Confirm")}</span>
      </PrimaryButton>
    </div>
  );
};

export default ActionButtons;
