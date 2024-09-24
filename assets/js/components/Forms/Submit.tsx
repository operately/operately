import * as React from "react";

import { useFormContext } from "./FormContext";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";

interface SubmitProps {
  saveText?: string;
  secondarySubmitText?: string;
  cancelText?: string;
  layout?: "left" | "centered";
  buttonSize?: "sm" | "lg";
}

const DEFAULT_LAYOUT = "left";
const DEFAULT_BUTTON_SIZE = "sm";
const DEFAULT_SAVE_TEXT = "Save";
const DEFAULT_CANCEL_TEXT = "Cancel";

export function Submit(props: SubmitProps) {
  const form = useFormContext();

  const layout = props.layout || DEFAULT_LAYOUT;
  const saveText = props.saveText || DEFAULT_SAVE_TEXT;
  const cancelText = props.cancelText || DEFAULT_CANCEL_TEXT;
  const buttonSize = props.buttonSize || DEFAULT_BUTTON_SIZE;

  const className = classNames("flex items-center gap-2 mt-8", {
    "justify-start": layout === "left",
    "justify-center": layout === "centered",
  });

  const loading = React.useMemo(() => form.state === "submitting", [form.state]);

  return (
    <div className={className}>
      <PrimaryButton type="submit" loading={loading} testId="submit" size={buttonSize}>
        {saveText}
      </PrimaryButton>

      {props.secondarySubmitText && (
        <GhostButton
          type="button"
          loading={form.state === "submitting"}
          testId="submit-secondary"
          size={buttonSize}
          onClick={form.actions.submit}
        >
          {props.secondarySubmitText}
        </GhostButton>
      )}

      {form.hasCancel && (
        <SecondaryButton onClick={form.actions.cancel} testId="cancel" size={buttonSize}>
          {cancelText}
        </SecondaryButton>
      )}
    </div>
  );
}
