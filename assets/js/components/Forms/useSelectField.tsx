import React from "react";

import { AddErrorFn, ValueField } from "./FormState";

export type SelectField = ValueField<string> & {
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
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const validate = (addError: AddErrorFn) => {
    if (config && config.optional) return;

    if (!value) return addError(fieldName!, "Can't be empty");

    return null;
  };

  const reset = () => setValue(initial);

  return {
    type: "select",
    initial,
    options,
    optional: config?.optional,
    value,
    setValue,
    validate,
    reset,
    fieldName,
    setFieldName,
  };
}
