import * as React from "react";
import Select from "react-select";

import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { SelectBoxProps } from "./types";

export function SelectBox(props: SelectBoxProps) {
  const { field, label, hidden, required } = props;
  const error = useFieldError(field);

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} required={required}>
      <SelectBoxInput {...props} />
    </InputField>
  );
}

function SelectBoxInput({ field, placeholder, options }: SelectBoxProps) {
  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  return (
    <div data-test-id={createTestId(field)} className="flex-1">
      <Select
        unstyled={true}
        className="flex-1"
        placeholder={placeholder}
        classNames={selectBoxClassNames(!!error)}
        value={options.find(({ value: optionValue }) => optionValue === value)}
        onChange={(option) => setValue(option?.value)}
        options={options}
        styles={selectBoxStyles()}
      />
    </div>
  );
}

function selectBoxClassNames(error: boolean) {
  return {
    control: ({ isFocused }: { isFocused: boolean }) => selectBoxControlStyles(isFocused, error),
    menu: () => "bg-surface-base text-content-accent border border-surface-outline rounded-lg mt-1",
    option: selectBoxOptionStyles,
  };
}

function selectBoxControlStyles(isFocused: boolean, error: boolean) {
  if (error) {
    return "bg-surface-base placeholder-content-dimmed border border-red-500 rounded-lg px-3 flex-1";
  }

  if (isFocused) {
    return "bg-surface-base placeholder-content-subtle border-2 border-blue-600 rounded-lg px-3";
  }

  return "bg-surface-base placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1";
}

function selectBoxOptionStyles({ isFocused }: { isFocused: boolean }) {
  return classNames({
    "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
    "bg-surface-accent": isFocused,
  });
}

function selectBoxStyles() {
  return {
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      "input:focus": {
        boxShadow: "none",
      },
    }),
  };
}
