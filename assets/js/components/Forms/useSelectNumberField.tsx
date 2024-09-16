import React from "react";

import { Field } from "./FormState";

type SelectField = Field<number> & {
  type: "select";
  options: { value: number; label: string }[];
  setOptions: (options: { value: number; label: string }[]) => void;
};

interface Config {
  optional?: boolean;
}

interface Option {
  value: number;
  label: string;
}

export function useSelectNumberField(
  initial: number | null | undefined,
  initialOptions: Option[],
  config?: Config,
): SelectField {
  const [value, setValue] = React.useState(initial);
  const [options, setOptions] = React.useState(initialOptions);

  const validate = (): string | null => {
    if (value === null || value === undefined) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  const reset = () => {
    setValue(initial);
    setOptions(initialOptions);
  };

  return { type: "select", initial, options, optional: config?.optional, value, setValue, validate, setOptions, reset };
}
