import React from "react";
import { DangerButton, PrimaryButton, SecondaryButton } from "../Button";
import { IconAlertTriangle, IconTrash } from "../icons";

export type ConfirmDialogSize = "xx-small" | "x-small" | "small" | "medium" | "large";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  size?: ConfirmDialogSize;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  testId?: string;
}

const SIZE_CLASSES: Record<ConfirmDialogSize, string> = {
  "xx-small": "max-w-xs",
  "x-small": "max-w-sm",
  small: "max-w-md",
  medium: "max-w-lg",
  large: "max-w-2xl",
};

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  size = "small",
  icon,
  testId,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const Icon = icon || (variant === "danger" ? IconTrash : IconAlertTriangle);
  const iconColor = variant === "danger" ? "text-content-error" : "text-content-base";
  const ConfirmButton = variant === "danger" ? DangerButton : PrimaryButton;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        data-test-id={testId}
        className={`bg-surface-base border border-stroke-base rounded-xl shadow-xl w-full ${SIZE_CLASSES[size]}`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Icon size={20} className={iconColor} />
            <h2 className="text-xl font-semibold text-content-base">{title}</h2>
          </div>

          <p className="text-content-base">{message}</p>

          <div className="flex gap-3 justify-end">
            <SecondaryButton onClick={onCancel}>
              {cancelText}
            </SecondaryButton>
            <ConfirmButton onClick={onConfirm}>
              {confirmText}
            </ConfirmButton>
          </div>
        </div>
      </div>
    </div>
  );
}