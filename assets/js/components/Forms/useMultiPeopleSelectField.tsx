import * as React from "react";

import { Person } from "@/api";
import { Field } from "./FormState";

export type MultiSelectPersonField = Field<Person[]> & {
  type: "multi-select-person";
};

interface Config {
  optional?: boolean;
}

export function useMultiSelectPersonField(initial: Person[] | null, config?: Config): MultiSelectPersonField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "is required" : null;

    return null;
  };

  return { type: "multi-select-person", initial, optional: config?.optional, value, setValue, validate };
}
