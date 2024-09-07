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

  React.useEffect(() => {
    setChecked(defaultValue);
  }, [defaultValue]);

  return <RadioContext.Provider value={{ name, checked, changeChecked }}>{children}</RadioContext.Provider>;
}

interface RadioProps {
  label: string;
  value: string;
  disabled?: boolean;
  testId?: string;
}

export function Radio(props: RadioProps) {
  const { label, value, disabled, ...rest } = props;

  return (
    <label className="flex items-center gap-2">
      <InputElement value={value} disabled={disabled} {...rest} testId={props.testId} />
      <span className={disabled ? "text-content-subtle" : "text-content-accent"}>{label}</span>
    </label>
  );
}

function InputElement({ value, testId, ...props }) {
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
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-surface-outline",
      )}
      style={{
        backgroundImage: "none",
        boxShadow: "none",
      }}
      value={value}
      onChange={() => changeChecked(value)}
      checked={checked === value}
      name={name}
      data-test-id={testId}
      {...props}
    />
  );
}

export interface RadioGroupOption {
  label: string;
  value: string;
  default?: boolean;
}

export function useRadioGroupState(options: RadioGroupOption[]): [string, (value: string) => void, RadioGroupOption[]] {
  if (options.length === 0) throw new Error("RadioGroup options must not be empty");

  const defaultValue = options.find((option) => option.default)?.value ?? options[0]!.value;

  const [value, setValue] = React.useState(defaultValue);

  return [value, setValue, options];
}
