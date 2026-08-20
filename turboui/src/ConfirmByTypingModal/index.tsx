import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";
import * as Forms from "../Forms";
import { Modal } from "../Modal";

export namespace ConfirmByTypingModal {
  export interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    confirmationValue: string;
    warningMessage: string;
    warningDescription?: string | JSX.Element;
    confirmLabel?: string;
    loadingLabel?: string;
    inputTestId?: string;
    confirmTestId?: string;
    testId?: string;
  }
}

export function ConfirmByTypingModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmationValue,
  warningMessage,
  warningDescription,
  confirmLabel = "Confirm",
  loadingLabel,
  inputTestId,
  confirmTestId,
  testId,
}: ConfirmByTypingModal.Props) {
  const [typedValue, setTypedValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTypedValue("");
      setLoading(false);
    }
  }, [isOpen]);

  const matches = typedValue === confirmationValue;
  const confirmDisabled = !matches || loading;

  const handleConfirm = async () => {
    if (confirmDisabled) return;

    setLoading(true);
    try {
      await onConfirm();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
      closeOnBackdropClick={!loading}
      testId={testId}
    >
      <div className="space-y-4">
        <WarningCallout message={warningMessage} description={warningDescription} />

        <div className="flex flex-col gap-1">
          <Forms.Label field="confirm-by-typing" label={`To confirm, type "${confirmationValue}" in the box below`} />
          <Forms.Input
            id="confirm-by-typing"
            field="confirm-by-typing"
            type="text"
            testId={inputTestId}
            value={typedValue}
            onChange={(event) => setTypedValue(event.target.value)}
            autoFocus
          />
        </div>

        <div className="pt-4 flex justify-start gap-2">
          <DangerButton onClick={handleConfirm} disabled={confirmDisabled} loading={loading} testId={confirmTestId}>
            {loading ? loadingLabel ?? confirmLabel : confirmLabel}
          </DangerButton>
          <SecondaryButton onClick={onClose} disabled={loading}>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
