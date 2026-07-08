import * as React from "react";

import { GhostButton, PrimaryButton } from "../Button";
import { useFormContext } from "./context";
import type { SubmitButtonProps } from "./types";

export function SubmitButton({ name, onClick, text, buttonSize, primary, className }: SubmitButtonProps) {
  const form = useFormContext();

  const clickHandler = (attrs: unknown) => {
    form.actions.setTrigger(name);
    onClick(attrs);
  };

  const props = {
    type: "button" as const,
    loading: form.state === "submitting" && form.trigger === name,
    testId: name,
    size: buttonSize || "base",
    onClick: clickHandler,
    className,
  };

  if (primary) {
    return (
      <PrimaryButton {...props}>
        {text}
      </PrimaryButton>
    );
  }

  return (
    <GhostButton {...props}>
      {text}
    </GhostButton>
  );
}
