import * as React from "react";

import classNames from "classnames";
import { InputField } from "./FieldGroup";

import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";
import { validateTextLength } from "./validations/textLength";

import { useFieldValue, useFieldError } from "./FormContext";
import { createTestId } from "@/utils/testid";

interface TextInputProps {
  field: string;
  label?: string;
  autoFocus?: boolean;
  placeholder?: string;
  hidden?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  onEnter?: (e: React.KeyboardEvent) => void;
  testId?: string;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
  minLength: undefined,
  maxLength: undefined,
};

export function TextInput(props: TextInputProps) {
  const { field, label, hidden, placeholder } = props;
  const { required, minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <input
        name={field}
        autoFocus={props.autoFocus}
        placeholder={placeholder}
        data-test-id={props.testId ?? createTestId(field)}
        className={styles(!!error)}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && props.onEnter) {
            props.onEnter(e);
          }
        }}
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
