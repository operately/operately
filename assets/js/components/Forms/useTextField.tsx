import React from "react";

import { Field } from "./FormState";

export type TextField = Field<string> & {
  type: "text";
};

interface Config {
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function useTextField(initial?: string | null, config?: Config): TextField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return !config?.optional ? "Can't be empty" : null;
    } else {
      return null;
    }
  };

  return { type: "text", initial, optional: config?.optional, value: value, setValue, validate };
}
