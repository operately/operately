import * as React from "react";
import { IconCheck } from "turboui";

import classNames from "classnames";
import { InputField } from "./FieldGroup";

import { useValidation } from "./validations/hook";
import { isNumber } from "./validations/isNumber";

import { useFieldValue, useFieldError } from "./FormContext";
import { createTestId } from "@/utils/testid";

interface NumberInputProps {
  field: string;
  label?: string;
  autoFocus?: boolean;
  placeholder?: string;
  hidden?: boolean;
  required?: boolean;
  onEnter?: (e: React.KeyboardEvent) => void;
  testId?: string;
  okSign?: boolean;
}

export function NumberInput(props: NumberInputProps) {
  const { field, label, hidden, placeholder } = props;

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  useValidation(field, isNumber());

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <div className="relative">
        <input
          name={field}
          placeholder={placeholder}
          data-test-id={props.testId ?? createTestId(field)}
          className={styles(!!error)}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && props.onEnter) {
              props.onEnter(e);
            }
          }}
          autoFocus={props.autoFocus}
          data-autofocus={props.autoFocus}
        />

        {!error && props.okSign && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-accent-1">
            <IconCheck size={20} />
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
