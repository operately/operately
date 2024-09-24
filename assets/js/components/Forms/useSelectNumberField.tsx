import React from "react";

import { AddErrorFn, ValueField } from "./FormState";

type SelectField = ValueField<number> & {
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
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const validate = (addError: AddErrorFn) => {
    if (config && config.optional) return;

    if (value === null) return addError(fieldName!, "Can't be empty");
    if (value === undefined) return addError(fieldName!, "Can't be empty");

    return;
  };

  const reset = () => {
    setValue(initial);
    setOptions(initialOptions);
  };

  return {
    type: "select",
    initial: initial,
    options,
    optional: config?.optional,
    value,
    setValue,
    validate,
    setOptions,
    reset,
    fieldName,
    setFieldName,
  };
}
