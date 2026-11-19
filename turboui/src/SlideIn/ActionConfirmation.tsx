import { useTranslation } from "react-i18next";
import React from "react";
import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  confirmVariant?: "primary" | "danger";
  testId?: string;
}

export function ActionConfirmation(props: Props) {
  const { t } = useTranslation();
  if (!props.isOpen) return null;
  const ConfirmButton = props.confirmVariant === "primary" ? PrimaryButton : DangerButton;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] w-full max-w-sm shadow-2xl rounded-lg bg-surface-base border border-surface-outline overflow-hidden animate-fadeIn"
      data-test-id={props.testId}
    >
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          {props.title && <h3 className="text-content-base font-bold text-sm">{props.title}</h3>}
          {props.message && <div className="text-content-dimmed text-sm">{props.message}</div>}
        </div>

        <div className="flex items-center justify-end gap-2">
          <SecondaryButton
            size="xs"
            onClick={props.onClose}
            disabled={props.isConfirming}
            testId={props.testId ? `${props.testId}-cancel` : undefined}
          >
            {props.cancelLabel || t("Cancel")}
          </SecondaryButton>
          <ConfirmButton
            size="xs"
            onClick={props.onConfirm}
            loading={props.isConfirming}
            disabled={props.isConfirming}
            testId={props.testId ? `${props.testId}-confirm` : undefined}
          >
            {props.confirmLabel || t("Confirm")}
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
