import * as React from "react";

import { useFormContext } from "./FormContext";
import { GhostButton, PrimaryButton, SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { BaseButtonProps } from "../Buttons/UnstalyedButton";

interface SubmitProps {
  saveText?: string;
  secondarySubmitText?: string;
  cancelText?: string;
  layout?: "left" | "centered";
  buttonSize?: BaseButtonProps["size"];
  submitOnEnter?: boolean;
}

const DefaultSubmitProps: SubmitProps = {
  saveText: "Save",
  cancelText: "Cancel",
  layout: "left",
  buttonSize: "sm",
  submitOnEnter: false,
};

export function Submit(props: SubmitProps) {
  props = { ...DefaultSubmitProps, ...props };

  const form = useFormContext();

  const className = classNames("flex items-center gap-2 mt-8", {
    "justify-start": props.layout === "left",
    "justify-center": props.layout === "centered",
  });

  const loading = React.useMemo(() => form.state === "submitting" || form.state === "uploading", [form.state]);
  const buttonText = form.state === "uploading" ? "Uploading..." : props.saveText;

  const onSubmitClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    await form.actions.submit("primary");
  };

  // If submitOnEnter is true, the button type should be "submit" to allow form submission on enter key press
  // Otherwise, the button type should be "button" to prevent form submission on enter key press
  const buttonType = props.submitOnEnter ? "submit" : "button";

  return (
    <div className={className}>
      <PrimaryButton
        type={buttonType}
        loading={loading}
        testId="submit"
        size={props.buttonSize}
        onClick={onSubmitClick}
      >
        {buttonText}
      </PrimaryButton>

      {props.secondarySubmitText && (
        <GhostButton
          type="button"
          loading={form.state === "secondary-submitting"}
          testId="submit-secondary"
          size={props.buttonSize}
          onClick={() => form.actions.submit("secondary")}
        >
          {props.secondarySubmitText}
        </GhostButton>
      )}

      {form.hasCancel && (
        <SecondaryButton onClick={form.actions.cancel} testId="cancel" size={props.buttonSize}>
          {props.cancelText}
        </SecondaryButton>
      )}
    </div>
  );
}
