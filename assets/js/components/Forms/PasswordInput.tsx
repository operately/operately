import * as React from "react";

import classNames from "classnames";
import { InputField } from "./FieldGroup";
import { useFieldValue, useFieldError } from "./FormContext";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";
import { validateTextLength } from "./validations/textLength";

interface PasswordInputProps {
  field: string;
  label?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
  minLength: undefined,
  maxLength: undefined,
};

export function PasswordInput(props: PasswordInputProps) {
  const { field, label } = props;
  const { required, minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };
  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} label={label} error={error}>
      <input
        name={field}
        type="password"
        data-test-id={field}
        className={styles(!!error)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputField>
  );
}

function styles(error: boolean | undefined) {
  return classNames({
    "w-full": true,
    "bg-surface-base text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "px-3 py-1.5": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}
