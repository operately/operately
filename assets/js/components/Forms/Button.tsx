import { createElement } from "react";

import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { BaseButtonProps } from "@/components/Buttons/UnstalyedButton";
import { useFormContext } from "./FormContext";

interface Props {
  name: string;
  text: string;
  onClick: (attrs: any) => void;
  buttonSize?: BaseButtonProps["size"];
  primary?: boolean;
}

export function Button({ name, onClick, text, buttonSize, primary }: Props) {
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
  };

  if (primary) {
    return createElement(PrimaryButton, props as BaseButtonProps, text);
  } else {
    return createElement(GhostButton, props as BaseButtonProps, text);
  }
}
