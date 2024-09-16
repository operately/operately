import * as React from "react";
import * as People from "@/models/people";

import { Person } from "@/api";
import { Field } from "./FormState";

type SearchFn = (query: string) => Promise<Person[]>;

export type SelectPersonField = Field<Person> & {
  type: "select-person";
  exclude?: Person[];
  searchFn: SearchFn;
};

interface Config {
  optional?: boolean;
  exclude?: Person[];
  searchFn?: SearchFn;
}

export function useSelectPersonField(initial?: Person | null, config?: Config): SelectPersonField {
  const [value, setValue] = React.useState(initial);

  const searchFn = useSearchFn(config);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  const reset = () => setValue(initial);

  return {
    type: "select-person",
    initial,
    optional: config?.optional,
    value,
    setValue,
    validate,
    exclude: config?.exclude,
    searchFn,
    reset,
  };
}

function useSearchFn(config?: Config): SearchFn {
  if (config?.searchFn) {
    return config.searchFn;
  } else {
    return People.usePeopleSearch();
  }
}
