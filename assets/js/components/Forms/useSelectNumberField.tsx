import React from "react";

import { Field } from "./FormState";

type SelectField = Field<number> & {
  type: "select";
  options: { value: number; label: string }[];
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
  options: Option[],
  config?: Config,
): SelectField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  return { type: "select", initial, options, optional: config?.optional, value, setValue, validate };
}
