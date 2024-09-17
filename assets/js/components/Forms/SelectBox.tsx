import React from "react";
import Select from "react-select";
import classnames from "classnames";

import { getFormContext, useField } from "./FormContext";
import { InputField } from "./FieldGroup";
import { SelectField } from "./useSelectField";

interface SelectBoxProps {
  field: string;
  label?: string;
  labelIcon?: React.ReactNode;
  hidden?: boolean;
  placeholder?: string;
}

export function SelectBox({ field, label, labelIcon, placeholder, hidden }: SelectBoxProps) {
  const form = getFormContext();
  const error = form.errors[field];

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} labelIcon={labelIcon}>
      <SelectBoxInput field={field} placeholder={placeholder} error={!!error} />
    </InputField>
  );
}

function SelectBoxInput({ field, placeholder, error }: { field: string; placeholder?: string; error: boolean }) {
  const f = useField<SelectField>(field);

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
