import React from "react";

import classnames from "classnames";

interface RadioGroupContextDescriptor {
  name: string;
  checked: string | null;
  changeChecked: (value: string) => void;
}

const RadioContext = React.createContext<RadioGroupContextDescriptor | null>(null);

export function RadioGroup({ name, defaultValue, onChange, children }) {
  const [checked, setChecked] = React.useState<string | null>(defaultValue);

  const changeChecked = (value: string) => {
    setChecked(value);
    onChange(value);
  };

  return <RadioContext.Provider value={{ name, checked, changeChecked }}>{children}</RadioContext.Provider>;
}

export function RadioGroupWithLabel({ label, name, defaultValue, onChange, children }) {
  return (
    <RadioGroup name={name} defaultValue={defaultValue} onChange={onChange}>
      <div>
        <label className="font-bold mb-4 block">{label}</label>
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </RadioGroup>
  );
}

export function Radio({ label, value, ...props }) {
  return (
    <label className="flex items-center gap-2">
      <InputElement value={value} {...props} />
      {label}
    </label>
  );
}

export function RadioWithExplanation({ label, value, explanation, ...props }) {
  return (
    <label className="flex items-start gap-2">
      <InputElement value={value} {...props} />

      <div className="flex flex-col">
        <div className="text-content-accent font-semibold leading-none">{label}</div>
        <div className="text-sm text-content-dimmed max-w-md mt-0.5">{explanation}</div>
      </div>
    </label>
  );
}

function InputElement({ value, ...props }) {
  const { name, checked, changeChecked } = React.useContext(RadioContext) as RadioGroupContextDescriptor;

  return (
    <input
      type="radio"
      className={classnames(
        "before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none",
        "rounded-full border border-surface-outline text-content-accent transition-all",
        "hover:border-blue-400 hover:border-y-[3px] hover:border-x-[3px]",
        "checked:border-blue-400 checked:border-y-[5px] checked:border-x-[5px] checked:bg-shade-1",
        "checked:hover:border-blue-400 checked:hover:border-y-[4px] checked:hover:border-x-[4px] checked:hover:bg-shade-1",
        "focus:outline-none focus:checked:border-blue-400 focus:checked:border-y-[5px] focus:checked:border-x-[5px] focus:shadow-white focus:checked:bg-shade-1",
      )}
      style={{
        backgroundImage: "none",
        boxShadow: "none",
      }}
      value={value}
      onChange={() => changeChecked(value)}
      checked={checked === value}
      name={name}
      {...props}
    />
  );
}
