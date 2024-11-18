import * as React from "react";

import classNames from "classnames";
import { InputField } from "./FieldGroup";

import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";
import { validateTextLength } from "./validations/textLength";

import { useFieldValue, useFieldError } from "./FormContext";
import { createTestId } from "@/utils/testid";

interface TitleInputProps {
  field: string;
  autoFocus?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  testId?: string;
}

const DEFAULT_VALIDATION_PROPS = {
  minLength: undefined,
  maxLength: undefined,
};

export function TitleInput(props: TitleInputProps) {
  const { field, placeholder } = props;
  const { minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(true));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} error={error}>
      <input
        name={field}
        autoFocus={props.autoFocus}
        placeholder={placeholder}
        data-test-id={props.testId ?? createTestId(field)}
        className={styles(!!error)}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </InputField>
  );
}

function styles(error: boolean | undefined) {
  return classNames(
    "bg-surface-base",
    "text-3xl",
    "font-semibold",
    "border-none",
    "outline-none",
    "focus:outline-none",
    "focus:ring-0",
    "px-0 py-1",
    "w-full",
    "resize-none",
    "ring-0",
    "placeholder:text-content-subtle",
    "leading-wide",
    {
      "border-surface-outline": !error,
      "border-red-500": error,
    },
  );
}
