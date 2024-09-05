import * as React from "react";

import classNames from "classnames";
import { getFormContext } from "./FormContext";
import { InputField } from "./FieldGroup";

interface TextInputProps {
  field: string;
  label?: string;
  placeholder?: string;
  hidden?: boolean;
}

export function TextInput({ field, label, placeholder, hidden }: TextInputProps) {
  const form = getFormContext();
  const error = form.errors[field];
  const f = form.fields[field];

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <input
        name={field}
        placeholder={placeholder}
        data-test-id={field}
        className={styles(!!error)}
        type="text"
        value={f.value}
        onChange={(e) => f.setValue(e.target.value)}
      />
    </InputField>
  );
}

function styles(error: boolean | undefined) {
  return classNames({
    "w-full": true,
    "bg-surface text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "px-3 py-1.5": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}
