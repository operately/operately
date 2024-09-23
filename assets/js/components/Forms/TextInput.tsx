import * as React from "react";

import classNames from "classnames";
import { getFormContext } from "./FormContext";
import { InputField } from "./FieldGroup";
import { AddErrorFn } from "./FormState";
import { useValidation } from "./useForm";

interface TextInputProps {
  field: string;
  label?: string;
  placeholder?: string;
  hidden?: boolean;
}

function useCantBeBlankValidation(field: string) {
  const form = getFormContext();

  const cantBeBlank = React.useCallback(
    (addError: AddErrorFn) => {
      const value = form.getField(field);
      if (value === "") {
        addError(field, "Can't be blank    ooooo");
      }
    },
    [field],
  );

  useValidation(field, cantBeBlank);
}

export function TextInput({ field, label, placeholder, hidden }: TextInputProps) {
  const form = getFormContext();
  const error = form.errors[field];

  useCantBeBlankValidation(field);

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <input
        name={field}
        placeholder={placeholder}
        data-test-id={field}
        className={styles(!!error)}
        type="text"
        value={form.getField(field)}
        onChange={(e) => form.setField(field, e.target.value)}
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
