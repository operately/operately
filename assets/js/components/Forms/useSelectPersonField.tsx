import * as React from "react";

import { Person } from "@/api";
import { Field } from "./FormState";

export type SelectPersonField = Field<Person> & {
  type: "select-person";
  exclude?: Person[];
};

interface Config {
  optional?: boolean;
  exclude?: Person[];
}

export function useSelectPersonField(initial?: Person | null, config?: Config): SelectPersonField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  return {
    type: "select-person",
    initial,
    optional: config?.optional,
    value,
    setValue,
    validate,
    exclude: config?.exclude,
  };
}
