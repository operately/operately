import React from "react";

import { Person } from "@/models/people";
import { Field } from "./FormState";

export type SelectMultiPeopleField = Field<Person[]> & {
  type: "select-multi-people";
  setValue: React.Dispatch<React.SetStateAction<Person[]>>;
  options: Person[];
  alwaysSelected: Person[];
};

interface Config {
  optional?: boolean;
  alwaysSelected?: Person[];
}

export function useMultiPeopleSelectField(options: Person[], config?: Config): SelectMultiPeopleField {
  const alwaysSelected = config?.alwaysSelected ? [...config.alwaysSelected] : [];
  const [value, setValue] = React.useState<Person[]>(alwaysSelected);

  const validate = (): string | null => {
    if (value.length < 1) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  return {
    type: "select-multi-people",
    value,
    setValue,
    validate,
    options,
    optional: config?.optional,
    alwaysSelected,
  };
}
