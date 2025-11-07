import * as React from "react";

import { createTestId } from "@/utils/testid";

import { InputField } from "./FieldGroup";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";
import { validateTextLength } from "./validations/textLength";
import { InputElement } from "./Elements";
import { useFieldValue, useFieldError } from "./FormContext";

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
  okSign?: boolean;
}

const DEFAULT_VALIDATION_PROPS = {
  required: false,
  minLength: undefined,
  maxLength: undefined,
};

export function TextInput(props: TextInputProps) {
  const { field, label, hidden } = props;
  const { required, minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} required={required}>
      <InputElement
        testId={props.testId ?? createTestId(field)}
        error={!!error}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
    </InputField>
  );
}
