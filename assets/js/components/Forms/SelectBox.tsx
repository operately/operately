import React from "react";
import Select from "react-select";
import classnames from "classnames";

import { useFieldError, useFieldValue } from "./FormContext";
import { InputField } from "./FieldGroup";

interface Option {
  label: string;
  value: any;
}

interface SelectBoxProps {
  field: string;
  label?: string;
  labelIcon?: React.ReactNode;
  hidden?: boolean;
  placeholder?: string;
  options: Option[];
}

export function SelectBox(props: SelectBoxProps) {
  const { field, label, labelIcon, hidden } = props;
  const error = useFieldError(field);

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} labelIcon={labelIcon}>
      <SelectBoxInput {...props} />
    </InputField>
  );
}

function SelectBoxInput({ field, placeholder, options }: SelectBoxProps) {
  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  return (
    <div data-test-id={field} className="flex-1">
      <Select
        unstyled={true}
        className="flex-1"
        placeholder={placeholder}
        classNames={selectBoxClassNames(!!error)}
        value={options.find(({ value: v }) => v === value)}
        onChange={(option) => setValue(option?.value)}
        options={options}
        styles={selectBoxStyles()}
      />
    </div>
  );
}

function selectBoxClassNames(error: boolean | undefined) {
  return {
    control: ({ isFocused }) => selectBoxControlStyles(isFocused, error),
    menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1",
    option: selectBoxOptionStyles,
  };
}

function selectBoxControlStyles(isFocused: boolean, error: boolean | undefined) {
  if (error) {
    return "bg-surface placeholder-content-dimmed border border-red-500 rounded-lg px-3 flex-1";
  }

  if (isFocused) {
    return "bg-surface placeholder-content-subtle border-2 border-blue-600 rounded-lg px-3";
  }

  return "bg-surface placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1";
}

function selectBoxOptionStyles({ isFocused }: { isFocused: boolean }) {
  return classnames({
    "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
    "bg-surface-accent": isFocused,
  });
}

function selectBoxStyles() {
  return {
    input: (provided: any) => ({
      ...provided,
      "input:focus": {
        boxShadow: "none",
      },
    }),
  };
}
