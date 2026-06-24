import React from "react";

import classNames from "../utils/classnames";
import { useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { CheckboxInputProps } from "./types";

export function CheckboxInput({ field, label, hidden, options }: CheckboxInputProps) {
  return (
    <InputField field={field} label={label} hidden={hidden}>
      <div className="flex flex-col gap-2 mt-1">
        {options.map((option) => (
          <Checkbox key={option.value} field={field} value={option.value} label={option.label} />
        ))}
      </div>
    </InputField>
  );
}

function Checkbox({ field, value, label }: { field: string; value: string; label: string }) {
  const [checkedValues, setCheckedValues] = useFieldValue<string[]>(field);

  const handleChange = () => {
    const currentValues = checkedValues ?? [];

    if (currentValues.includes(value)) {
      setCheckedValues(currentValues.filter((item) => item !== value));
    } else {
      setCheckedValues([...currentValues, value]);
    }
  };

  return (
    <label className="flex items-start gap-2">
      <input
        data-test-id={field + "-" + value}
        name={field}
        type="checkbox"
        className={checkboxClass}
        style={checkboxStyle}
        value={value}
        onChange={handleChange}
        checked={(checkedValues ?? []).includes(value)}
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

const checkboxStyle = {
  boxShadow: "none",
};
