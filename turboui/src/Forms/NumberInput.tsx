import * as React from "react";

import { IconCheck } from "../icons";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { NumberInputProps } from "./types";
import { useValidation, validateIsNumber } from "./validation";

export function NumberInput(props: NumberInputProps) {
  const { field, label, hidden, placeholder } = props;
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);

  useValidation(field, validateIsNumber());

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <div className="relative">
        <input
          name={field}
          placeholder={placeholder}
          data-test-id={props.testId ?? createTestId(field)}
          className={inputStyles(!!error)}
          type="number"
          value={value ?? ""}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && props.onEnter) {
              props.onEnter(event);
            }
          }}
          autoFocus={props.autoFocus}
          data-autofocus={props.autoFocus ? true : undefined}
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
