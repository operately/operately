import * as React from "react";

import { ErrorMessage } from "./ErrorMessage";
import { useFormContext } from "./FormContext";

const DEFAULT_MESSAGE = "Please fix the errors above.";

interface Props {
  message?: string;
  when?: boolean;
  className?: string;
}

export function FormError({ message = DEFAULT_MESSAGE, when, className }: Props) {
  const form = useFormContext();
  const hasErrors = form.hasErrors ?? Object.keys(form.errors).length > 0;
  const shouldShow = when ?? hasErrors;

  if (!shouldShow) return null;

  return (
    <div className={className}>
      <ErrorMessage error={message} />
    </div>
  );
}
