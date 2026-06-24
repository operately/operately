import * as React from "react";

import { createTestId } from "../TestableElement";
import { Input } from "./Input";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import { useValidation, validatePresence, validateTextLength } from "./validation";
import type { TextInputProps } from "./types";

const DEFAULT_VALIDATION_PROPS = {
  required: false,
  minLength: undefined,
  maxLength: undefined,
};

export function TextInput(props: TextInputProps) {
  const { field, label, hidden, testId, autoFocus, placeholder, onEnter, okSign } = props;
  const { required, minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} required={required}>
      <Input
        id={field}
        field={field}
        testId={testId ?? createTestId(field)}
        error={!!error}
        type="text"
        value={value ?? ""}
        autoFocus={autoFocus}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        onEnter={onEnter}
        okSign={okSign}
        onChange={(event) => setValue(event.target.value)}
      />
    </InputField>
  );
}
