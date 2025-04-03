import React from "react";

import { useFieldValue } from "./FormContext";
import { InputField } from "./FieldGroup";

import classNames from "classnames";

interface Option {
  value: string;
  label: string;
}

interface CheckboxInputProps {
  field: string;
  label?: string;
  hidden?: boolean;
  options: Option[];
}

export function CheckboxInput({ field, label, hidden, options }: CheckboxInputProps) {
  return (
    <InputField field={field} label={label} hidden={hidden}>
      <div className="flex flex-col gap-2 mt-1">
        {options.map((option: Option) => (
          <Checkbox key={option.value} field={field} value={option.value} label={option.label} />
        ))}
      </div>
    </InputField>
  );
}

function Checkbox({ field, value, label }: { field: string; value: string; label: string }) {
  const [checkedValues, setCheckedValues] = useFieldValue<string[]>(field);

  const handleChange = () => {
    if (checkedValues.includes(value)) {
      setCheckedValues(checkedValues.filter((obj) => obj !== value));
    } else {
      setCheckedValues([...checkedValues, value]);
    }
  };

  return (
    <label className="flex items-start gap-2">
      <input
        data-test-id={field + "-" + value}
        name={field}
        type="checkbox"
        className={checkboxClass}
        style={CheckboxStyle}
        value={value}
        onChange={handleChange}
        checked={checkedValues.includes(value)}
      />

      <div className="flex flex-col">
        <div className="text-content-accent leading-none">{label}</div>
      </div>
    </label>
  );
}

const checkboxClass = classNames(
  "before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none",
  "border border-surface-outline transition-all",
  "checked:text-blue-400",
);

const CheckboxStyle = {
  boxShadow: "none",
};
