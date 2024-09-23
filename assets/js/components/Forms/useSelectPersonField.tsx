import * as React from "react";
import * as People from "@/models/people";

import { Person } from "@/api";
import { AddErrorFn, ValueField } from "./FormState";

type SearchFn = (query: string) => Promise<Person[]>;

export type SelectPersonField = ValueField<Person> & {
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
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const searchFn = useSearchFn(config);

  const validate = (addError: AddErrorFn) => {
    if (config && config.optional) return;

    if (!value) return addError(fieldName!, "Can't be empty");

    return null;
  };

  const reset = () => setValue(initial);

  return {
    type: "select-person",
    fieldName,
    setFieldName,
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
