import * as React from "react";

import { getFormContext } from "./FormContext";
import { Label } from "./Label";
import { FieldGroupItem } from "./FieldGroup";

import classNames from "classnames";

export function RadioButtons({ field, label }: { field: string; label?: string }) {
  const form = getFormContext();
  const f = form.fields[field];

  return (
    <FieldGroupItem
      label={label ? <Label field={field} label={label} /> : null}
      input={
        <div className="flex flex-col gap-2 mt-1">
          {f.options.map((option: { value: string; label: string }) => (
            <RadioButton key={option.value} field={field} value={option.value} label={option.label} />
          ))}
        </div>
      }
      error={null}
    />
  );
}

function RadioButton({ field, value, label }: { field: string; value: string; label: string }) {
  const form = getFormContext();
  const f = form.fields[field];

  return (
    <label className="flex items-start gap-2">
      <input
        name={field}
        type="radio"
        className={RadioClass}
        style={RadioStyle}
        value={value}
        onChange={() => f.setValue(value)}
        checked={value === f.value}
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
