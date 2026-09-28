import React from "react";
import { SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { Modal } from "../Modal";
import { SwitchToggle } from "../SwitchToggle";
import { useTimeAction } from "./useTimeAction";
import type { TimeActionResult } from "./types";

export function ProjectTimeSettings({
  enabled,
  onChange,
  onClose,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => Promise<TimeActionResult>;
  onClose: () => void;
}) {
  const action = useTimeAction();
  return (
    <Modal
      isOpen
      title="Time tracking settings"
      size="small"
      onClose={() => {
        if (!action.pending) onClose();
      }}
    >
      <div className="space-y-4">
        <fieldset disabled={action.pending}>
          <SwitchToggle
            label="Enable time tracking"
            value={enabled}
            setValue={(value) => {
              void action.run(() => onChange(value));
            }}
          />
        </fieldset>
        <p className="text-sm text-content-dimmed">
          Allow people to log time on this project and its tasks. Turning this off keeps existing entries.
        </p>
        {action.error && (
          <div role="alert">
            <ErrorCallout message={action.error} />
          </div>
        )}
        <SecondaryButton size="sm" disabled={action.pending} onClick={onClose}>
          Done
        </SecondaryButton>
      </div>
    </Modal>
  );
}
