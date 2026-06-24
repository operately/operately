import * as React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import classNames from "../utils/classnames";
import { useFormContext } from "./context";
import type { SubmitProps } from "./types";

const DEFAULT_SUBMIT_PROPS: Required<Pick<SubmitProps, "saveText" | "cancelText" | "layout" | "buttonSize" | "submitOnEnter">> = {
  saveText: "Save",
  cancelText: "Cancel",
  layout: "left",
  buttonSize: "sm",
  submitOnEnter: false,
};

export function Submit(props: SubmitProps) {
  const form = useFormContext();
  const {
    buttonSize,
    cancelText,
    className,
    containerClassName,
    layout,
    saveText,
    submitOnEnter,
    testId,
  } = { ...DEFAULT_SUBMIT_PROPS, ...props };
  const isLoading = form.state === "submitting" || form.state === "uploading";
  const label = form.state === "uploading" ? "Uploading..." : saveText;
  const buttonType = submitOnEnter ? "submit" : "button";

  const containerStyles = classNames(
    "mt-8 flex items-center gap-2",
    layout === "centered" ? "justify-center" : "justify-start",
    containerClassName,
  );

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await form.actions.submit();
  };

  return (
    <div className={containerStyles}>
      <PrimaryButton type={buttonType} size={buttonSize} loading={isLoading} testId={testId ?? "submit"} onClick={handleSubmit} className={className}>
        {label}
      </PrimaryButton>

      {form.hasCancel ? (
        <SecondaryButton type="button" size={buttonSize} testId="cancel" onClick={() => void form.actions.cancel()}>
          {cancelText}
        </SecondaryButton>
      ) : null}
    </div>
  );
}
