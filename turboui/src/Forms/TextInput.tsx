import * as React from "react";

import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import { useValidation, validatePresence } from "./validation";
import type { TextInputProps } from "./types";

export function TextInput({ field, label, testId, autoFocus, required, placeholder }: TextInputProps) {
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));

  return (
    <InputField field={field} label={label} error={error} required={required}>
      <input
        id={field}
        name={field}
        type="text"
        value={value ?? ""}
        autoFocus={autoFocus}
        placeholder={placeholder}
        data-test-id={testId}
        onChange={(event) => setValue(event.target.value)}
        className={[
          "w-full rounded-lg border bg-surface-base px-3 py-1.5 text-content-accent placeholder-content-subtle",
          error ? "border-red-500" : "border-surface-outline",
        ].join(" ")}
      />
    </InputField>
  );
}
