import React from "react";

import { Field } from "./FormState";

type TextField = Field<string> & {
  type: "text";
};

interface Config {
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function useTextField(initial?: string | null, config?: Config): TextField {
  const [value, setValue] = React.useState(initial);

  if (config?.minLength && config?.maxLength && config.minLength > config.maxLength) {
    throw new Error("minLength must be less than or equal to maxLength");
  }

  const validate = (): string | null => {
    if (!config?.optional && !value) return "Can't be empty";
    if (config?.optional && !value) return null;

    const trimmed = value!.trim();

    if (trimmed.length === 0) {
      return !config?.optional ? "Can't be empty" : null;
    }

    if (config?.minLength && trimmed.length < config.minLength) {
      return `Must be at least ${config.minLength} characters long`;
    }

    if (config?.maxLength && trimmed.length > config.maxLength) {
      return `Must be at most ${config.maxLength} characters long`;
    }

    return null;
  };

  return { type: "text", initial, optional: config?.optional, value: value, setValue, validate };
}
