import * as React from "react";
import * as Icons from "@tabler/icons-react";

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
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  noAutofill?: boolean;
  okSign?: boolean;
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
      <div className="relative">
        <input
          name={field}
          type="password"
          data-test-id={field}
          className={styles(!!error)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={props.placeholder}
          autoComplete={props.noAutofill ? "one-time-code" : ""}
        />

        {!error && props.okSign && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-accent-1">
            <Icons.IconCheck size={20} />
          </div>
        )}
      </div>
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
