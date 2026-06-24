import * as React from "react";

import classNames from "../utils/classnames";
import { IconCheck } from "../icons";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { PasswordInputProps } from "./types";
import { useValidation, validatePresence, validateTextLength } from "./validation";

const DEFAULT_VALIDATION_PROPS = {
  required: true,
  minLength: undefined,
  maxLength: undefined,
};

export function PasswordInput(props: PasswordInputProps) {
  const { field, label } = props;
  const { required, minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));
  useValidation(field, validateTextLength(minLength, maxLength));

  return (
    <InputField field={field} label={label} error={error} required={required}>
      <div className="relative">
        <input
          name={field}
          type="password"
          data-test-id={props.testId ?? field}
          className={inputStyles(!!error)}
          value={value ?? ""}
          onChange={(event) => setValue(event.target.value)}
          placeholder={props.placeholder}
          autoComplete={props.noAutofill ? "one-time-code" : ""}
        />

        {!error && props.okSign ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-accent-1">
            <IconCheck size={20} />
          </div>
        ) : null}
      </div>
    </InputField>
  );
}

function inputStyles(error: boolean) {
  return classNames(
    "w-full bg-surface-base text-content-accent placeholder-content-subtle border rounded-lg px-3 py-1.5",
    error ? "border-red-500" : "border-surface-outline",
  );
}
