import React from "react";

import { Field } from "./FormState";

export type SelectField = Field<string> & {
  type: "select";
  options: { value: string; label: string }[];
};

interface Config {
  optional?: boolean;
}

interface Option {
  value: string;
  label: string;
}

export function useSelectField(initial: string | null | undefined, options: Option[], config?: Config): SelectField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  return { type: "select", initial, options, optional: config?.optional, value, setValue, validate };
}
