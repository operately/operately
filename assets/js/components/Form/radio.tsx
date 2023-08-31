import React from "react";

import classnames from "classnames";

interface RadioGroupContextDescriptor {
  name: string;
  checked: string | null;
  changeChecked: (value: string) => void;
}

const RadioContext = React.createContext<RadioGroupContextDescriptor | null>(null);

export function RadioGroup({ label, name, defaultValue, onChange, children }) {
  const [checked, setChecked] = React.useState<string | null>(defaultValue);

  const changeChecked = (value: string) => {
    setChecked(value);
    onChange(value);
  };

  return (
    <div>
      <RadioContext.Provider value={{ name, checked, changeChecked }}>
        <label className="font-bold mb-4 block">{label}</label>

        <div className="flex flex-col gap-2">{children}</div>
      </RadioContext.Provider>
    </div>
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
        <div className="text-white-1 font-medium leading-none">{label}</div>
        <div className="text-sm text-white-2 leading-loose">{explanation}</div>
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
        "rounded-full border border-white-2 text-white-1 transition-all",
        "hover:border-white-1 hover:border-y-[1px] hover:border-x-[1px]",
        "checked:border-white-1 checked:border-y-[5px] checked:border-x-[5px]",
        "checked:hover:border-white-1 checked:hover:border-y-[4px] checked:hover:border-x-[4px]",
        "focus:outline-none focus:checked:border-white-1 focus:checked:border-y-[5px] focus:checked:border-x-[5px] focus:shadow-white",
      )}
      style={{
        background: "transparent",
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
