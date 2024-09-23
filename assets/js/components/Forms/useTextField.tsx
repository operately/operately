import React from "react";

import { AddErrorFn, ValueField } from "./FormState";

type TextField = ValueField<string> & {
  type: "text";
};

interface Config {
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
}

export function useTextField(initial?: string | null, config?: Config): TextField {
  const [value, setValue] = React.useState(initial);
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  if (config?.minLength && config?.maxLength && config.minLength > config.maxLength) {
    throw new Error("minLength must be less than or equal to maxLength");
  }

  const validate = (addError: AddErrorFn) => {
    if (config && config.optional) return;

    if (!value) return addError(fieldName!, "Can't be empty");

    const trimmed = value!.trim();

    if (trimmed.length === 0) {
      return addError(fieldName!, "Can't be empty");
    }

    if (config?.minLength && trimmed.length < config.minLength) {
      return addError(fieldName!, `Must be at least ${config.minLength} characters long`);
    }

    if (config?.maxLength && trimmed.length > config.maxLength) {
      return addError(fieldName!, `Must be at most ${config.maxLength} characters long`);
    }
  };

  const reset = () => setValue(initial);

  return {
    type: "text",
    initial,
    optional: config?.optional,
    value: value,
    setValue,
    validate,
    reset,
    fieldName,
    setFieldName,
  };
}
