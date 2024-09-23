import React from "react";

import { Person } from "@/models/people";
import { AddErrorFn, ValueField } from "./FormState";

type SelectMultiPeopleField = ValueField<Person[]> & {
  type: "select-multi-people";
  setValue: React.Dispatch<React.SetStateAction<Person[]>>;
  options: Person[];
  alwaysSelected: Person[];
};

interface Config {
  optional?: boolean;
  alwaysSelected?: Person[];
  alreadySelected?: Person[];
}

export function useMultiPeopleSelectField(options: Person[], config?: Config): SelectMultiPeopleField {
  const alwaysSelected = config?.alwaysSelected ? [...config.alwaysSelected] : [];

  const [value, setValue] = React.useState<Person[]>(config?.alreadySelected || []);
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const validate = (addError: AddErrorFn) => {
    if (config && config.optional) return;

    if (value.length < 1) return addError(fieldName!, "Can't be empty");
  };

  const reset = () => null;

  return {
    type: "select-multi-people",
    value,
    setValue,
    validate,
    options,
    optional: config?.optional,
    alwaysSelected,
    reset,
    fieldName,
    setFieldName,
  };
}
