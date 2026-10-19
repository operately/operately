import * as React from "react";

import classNames from "../utils/classnames";
import { useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { RadioButtonsProps } from "./types";

export function RadioButtons({
  field,
  label,
  hidden,
  options,
  containerClass,
  variant = "default",
}: RadioButtonsProps) {
  const className = classNames(
    "mt-1",
    containerClass ?? (variant === "cards" ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"),
  );

  return (
    <InputField field={field} label={label} hidden={hidden}>
      <div className={className}>
        {options.map((option) => (
          <RadioButton key={option.value} field={field} {...option} variant={variant} />
        ))}
      </div>
    </InputField>
  );
}

function RadioButton({
  field,
  value,
  label,
  icon,
  variant,
}: {
  field: string;
  value: string;
  label: string;
  icon?: React.ReactNode;
  variant: RadioButtonsProps["variant"];
}) {
  const [activeValue, setActiveValue] = useFieldValue<string>(field);
  const isCard = variant === "cards";

  return (
    <label className={isCard ? "relative flex min-w-0" : "flex items-start gap-2"}>
      <input
        data-test-id={field + "-" + value}
        name={field}
        type="radio"
        className={isCard ? cardClass : radioClass}
        style={radioStyle}
        value={value}
        onChange={() => setActiveValue(value)}
        checked={value === activeValue}
      />

      <div
        className={
          isCard
            ? "relative pointer-events-none flex min-h-24 w-full flex-col items-center justify-center gap-1.5 p-2 text-center"
            : "flex flex-col"
        }
      >
        {isCard && icon && <span aria-hidden="true">{icon}</span>}
        <div
          className={
            isCard ? "text-content-accent text-sm font-semibold leading-tight" : "text-content-accent leading-none"
          }
        >
          {label}
        </div>
      </div>
    </label>
  );
}

const cardClass = classNames(
  "peer absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none rounded border",
  "border-surface-outline bg-surface-dimmed hover:bg-surface-accent",
  "checked:border-accent-1 checked:bg-surface-base checked:hover:bg-surface-accent",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-1",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const radioClass = classNames(
  "before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none",
  "rounded-full border border-surface-outline text-content-accent transition-all",
  "hover:border-blue-400 hover:border-y-[3px] hover:border-x-[3px]",
  "checked:border-blue-400 checked:border-y-[5px] checked:border-x-[5px] checked:bg-shade-1",
  "checked:hover:border-blue-400 checked:hover:border-y-[4px] checked:hover:border-x-[4px] checked:hover:bg-shade-1",
  "focus:outline-none focus:checked:border-blue-400 focus:checked:border-y-[5px] focus:checked:border-x-[5px] focus:shadow-white focus:checked:bg-shade-1",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-surface-outline",
);

const radioStyle = {
  backgroundImage: "none",
  boxShadow: "none",
};
