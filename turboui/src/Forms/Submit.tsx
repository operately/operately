import * as React from "react";
import { useTranslation } from "react-i18next";

import { PrimaryButton, SecondaryButton } from "../Button";
import classNames from "../utils/classnames";
import { useFormContext } from "./context";
import { translationText } from "../i18n";
import type { SubmitProps } from "./types";

const DEFAULT_SUBMIT_PROPS: Required<Pick<SubmitProps, "layout" | "buttonSize" | "submitOnEnter">> = {
  layout: "left",
  buttonSize: "sm",
  submitOnEnter: false,
};

export function Submit(props: SubmitProps) {
  const { t } = useTranslation();
  const form = useFormContext();
  const { buttonSize, className, containerClassName, layout, submitOnEnter, testId } = {
    ...DEFAULT_SUBMIT_PROPS,
    ...props,
  };
  const saveText = props.saveText ?? translationText(t("Save"));
  const cancelText = props.cancelText ?? translationText(t("Cancel"));
  const isLoading = form.state === "submitting" || form.state === "uploading";
  const label = form.state === "uploading" ? translationText(t("Uploading...")) : saveText;
  const buttonType = submitOnEnter ? "submit" : "button";

  const containerStyles = classNames(
    "flex items-center gap-2",
    layout === "centered" ? "justify-center" : "justify-start",
    containerClassName ?? "mt-8",
  );

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    await form.actions.submit();
  };

  return (
    <div className={containerStyles}>
      <PrimaryButton
        type={buttonType}
        size={buttonSize}
        loading={isLoading}
        disabled={props.disabled}
        testId={testId ?? "submit"}
        onClick={handleSubmit}
        className={className}
      >
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
