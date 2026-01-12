import { createElement } from "react";

import { PrimaryButton, GhostButton } from "turboui";
import { BaseButtonProps } from "turboui";
import { useFormContext } from "./FormContext";

interface Props {
  name: string;
  text: string;
  onClick: (attrs: any) => void;
  buttonSize?: BaseButtonProps["size"];
  primary?: boolean;
  className?: string;
}

export function SubmitButton({ name, onClick, text, buttonSize, primary, className }: Props) {
  const form = useFormContext();

  const clickHandler = (attrs: any) => {
    form.actions.setTrigger(name);
    onClick(attrs);
  };

  const props = {
    type: "button",
    loading: form.state === "submitting" && form.trigger === name,
    testId: name,
    size: buttonSize || "base",
    onClick: clickHandler,
    className,
  };

  if (primary) {
    return createElement(PrimaryButton, props as BaseButtonProps, text);
  } else {
    return createElement(GhostButton, props as BaseButtonProps, text);
  }
}
