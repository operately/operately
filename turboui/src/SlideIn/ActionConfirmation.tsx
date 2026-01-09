import React from "react";
import { DangerButton, SecondaryButton } from "../Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
}

export function ActionConfirmation(props: Props) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm shadow-2xl rounded-lg bg-surface-base border border-surface-outline overflow-hidden animate-fadeIn">
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          {props.title && (
            <h3 className="text-content-base font-bold text-sm">
              {props.title}
            </h3>
          )}
          {props.message && (
             <div className="text-content-dimmed text-sm">
               {props.message}
             </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <SecondaryButton size="xs" onClick={props.onClose} disabled={props.isConfirming}>
            {props.cancelLabel || "Cancel"}
          </SecondaryButton>
          <DangerButton size="xs" onClick={props.onConfirm} loading={props.isConfirming} disabled={props.isConfirming}>
            {props.confirmLabel || "Confirm"}
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
