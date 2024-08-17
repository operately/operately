import React from "react";
import Select from "react-select";
import classnames from "classnames";

import { getFormContext } from "./FormContext";
import { InputField } from "./FieldGroup";

interface SelectBoxProps {
  field: string;
  label?: string;
  placeholder?: string;
}

export function SelectBox({ field, label, placeholder }: SelectBoxProps) {
  const form = getFormContext();
  const error = form.errors[field];

  return (
    <InputField field={field} label={label} error={error}>
      <SelectBoxInput field={field} placeholder={placeholder} error={!!error} />
    </InputField>
  );
}

function SelectBoxInput({ field, placeholder, error }: SelectBoxProps & { error: boolean }) {
  const form = getFormContext();
  const f = form.fields[field];

  const onChange = ({ value }: { value: any }) => {
    f.setValue(value);
  };

  return (
    <div data-test-id={field} className="flex-1">
      <Select
        unstyled={true}
        className="flex-1"
        placeholder={placeholder}
        classNames={selectBoxClassNames(error)}
        value={f.options.find(({ value }) => value === f.value)}
        onChange={onChange}
        options={f.options}
        styles={selectBoxStyles()}
      />
    </div>
  );
}

function selectBoxClassNames(error: boolean | undefined) {
  return {
    control: () => selectBoxControlStyles(error),
    menu: () => "bg-surface text-content-accent border border-surface-outline rounded-lg mt-1",
    option: selectBoxOptionStyles,
  };
}

function selectBoxControlStyles(error: boolean | undefined) {
  if (error) {
    return "bg-surface placeholder-content-dimmed border border-red-500 rounded-lg px-3 flex-1";
  } else {
    return "bg-surface placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1";
  }
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
