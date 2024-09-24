import * as React from "react";

import { useFieldValue } from "./FormContext";
import { InputField } from "./FieldGroup";

import classNames from "classnames";

interface Option {
  value: string;
  label: string;
}

interface RadioButtonsProps {
  field: string;
  label?: string;
  hidden?: boolean;
  options: Option[];
}

export function RadioButtons({ field, label, hidden, options }: RadioButtonsProps) {
  return (
    <InputField field={field} label={label} hidden={hidden}>
      <div className="flex flex-col gap-2 mt-1">
        {options.map((option: Option) => (
          <RadioButton key={option.value} field={field} value={option.value} label={option.label} />
        ))}
      </div>
    </InputField>
  );
}

function RadioButton({ field, value, label }: { field: string; value: string; label: string }) {
  const [activeValue, setActiveValue] = useFieldValue(field);

  return (
    <label className="flex items-start gap-2">
      <input
        data-test-id={field + "-" + value}
        name={field}
        type="radio"
        className={RadioClass}
        style={RadioStyle}
        value={value}
        onChange={() => setActiveValue(value)}
        checked={value === activeValue}
      />

      <div className="flex flex-col">
        <div className="text-content-accent leading-none">{label}</div>
      </div>
    </label>
  );
}

const RadioClass = classNames(
  "before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none",
  "rounded-full border border-surface-outline text-content-accent transition-all",
  "hover:border-blue-400 hover:border-y-[3px] hover:border-x-[3px]",
  "checked:border-blue-400 checked:border-y-[5px] checked:border-x-[5px] checked:bg-shade-1",
  "checked:hover:border-blue-400 checked:hover:border-y-[4px] checked:hover:border-x-[4px] checked:hover:bg-shade-1",
  "focus:outline-none focus:checked:border-blue-400 focus:checked:border-y-[5px] focus:checked:border-x-[5px] focus:shadow-white focus:checked:bg-shade-1",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-surface-outline",
);

const RadioStyle = {
  backgroundImage: "none",
  boxShadow: "none",
};
