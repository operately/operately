import * as React from "react";

import { ErrorMessage } from "./ErrorMessage";
import { useFormContext } from "./context";
import type { FormErrorProps } from "./types";

const DEFAULT_MESSAGE = "Please fix the errors above.";

export function FormError({ message = DEFAULT_MESSAGE, when, className }: FormErrorProps) {
  const form = useFormContext();
  const shouldShow = when ?? form.hasErrors;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={className}>
      <ErrorMessage error={message} />
    </div>
  );
}
