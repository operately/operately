import React from "react";

interface RadioGroupContextDescriptor {
  name: string;
  checked: string | null;
  changeChecked: (value: string) => void;
}

const RadioContext = React.createContext<RadioGroupContextDescriptor | null>(null);

interface RadioGroupProps {
  name: string;
  defaultValue: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

export function RadioGroup({ name, defaultValue, onChange, children }: RadioGroupProps) {
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
  const { label, value, disabled, testId } = props;

  return (
    <label className="flex items-center gap-2">
      <InputElement value={value} disabled={disabled} testId={testId} />
      <span className={disabled ? "text-content-subtle" : "text-content-accent"}>{label}</span>
    </label>
  );
}

interface InputElementProps {
  value: string;
  testId?: string;
  disabled?: boolean;
}

function InputElement({ value, testId, disabled }: InputElementProps) {
  const context = React.useContext(RadioContext);
  
  if (!context) {
    throw new Error("Radio must be used within a RadioGroup");
  }

  const { name, checked, changeChecked } = context;

  return (
    <input
      type="radio"
      className={[
        "before:content[''] peer relative h-4 w-4 cursor-pointer appearance-none",
        "rounded-full border border-surface-outline text-content-accent transition-all",
        "hover:border-blue-400 hover:border-y-[3px] hover:border-x-[3px]",
        "checked:border-blue-400 checked:border-y-[5px] checked:border-x-[5px] checked:bg-shade-1",
        "checked:hover:border-blue-400 checked:hover:border-y-[4px] checked:hover:border-x-[4px] checked:hover:bg-shade-1",
        "focus:outline-none focus:checked:border-blue-400 focus:checked:border-y-[5px] focus:checked:border-x-[5px] focus:shadow-white focus:checked:bg-shade-1",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-surface-outline",
      ].join(" ")}
      style={{
        backgroundImage: "none",
        boxShadow: "none",
      }}
      value={value}
      onChange={() => changeChecked(value)}
      checked={checked === value}
      name={name}
      data-test-id={testId}
      disabled={disabled}
    />
  );
}
