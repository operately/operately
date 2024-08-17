import * as React from "react";

import classNames from "classnames";
import { getFormContext } from "./FormContext";
import { InputField } from "./FieldGroup";

export function TextInput({ field, label }: { field: string; label?: string }) {
  const form = getFormContext();
  const error = form.errors[field];
  const f = form.fields[field];

  return (
    <InputField field={field} label={label} error={error}>
      <input
        name={field}
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
