import * as React from "react";

import { getFormContext } from "./FormContext";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";

interface SubmitProps {
  saveText?: string;
  cancelText?: string;
  layout?: "left" | "centered";
}

export function Submit(props: SubmitProps) {
  const form = getFormContext();

  const className = classNames("flex items-center gap-2 mt-8", {
    "justify-start": props.layout === "left",
    "justify-center": props.layout === "centered",
  });

  const saveText = props.saveText || "Save";
  const cancelText = props.cancelText || "Cancel";

  return (
    <div className={className}>
      <PrimaryButton type="submit" loading={form.state === "submitting"} testId="submit" size="sm">
        {saveText}
      </PrimaryButton>

      {form.hasCancel && (
        <SecondaryButton onClick={() => form.actions.cancel(form)} testId="cancel" size="sm">
          {cancelText}
        </SecondaryButton>
      )}
    </div>
  );
}
