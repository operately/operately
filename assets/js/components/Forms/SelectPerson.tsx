import * as React from "react";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { useFieldValue, useFieldError } from "./FormContext";

import PeopleSearch, { Option } from "@/components/PeopleSearch";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";

type SearchFn = (query: string) => Promise<People.Person[]>;

interface SelectPersonProps {
  field: string;
  label?: string;
  hidden?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchFn?: SearchFn;
  exclude?: People.Person[];
  default?: People.Person | null;
  required?: boolean;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
};

export function SelectPerson(props: SelectPersonProps) {
  const error = useFieldError(props.field);

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden}>
      <SelectPersonInput {...props} />
    </InputField>
  );
}

function SelectPersonInput(props: SelectPersonProps) {
  const { field, searchFn, exclude } = props;
  const { required } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [_, setValue] = useFieldValue(field);
  const error = useFieldError(field);
  const loader = useSearchFn(searchFn);

  const onChange = (option: Option | null) => {
    setValue(option?.value!);
  };

  const excludedIds = buildExcludedIds(exclude);

  React.useEffect(() => {
    if (props.default) {
      setValue(props.default.id!);
    }
  }, [props.default]);

  useValidation(field, validatePresence(required));

  return (
    <div className="flex-1">
      <PeopleSearch
        inputId={props.field}
        onChange={onChange}
        placeholder="Search for person..."
        defaultValue={props.default || undefined}
        loader={loader}
        error={!!error}
        filterOption={(candidate) => !excludedIds[candidate.value]}
        allowEmptySelection={props.allowEmpty}
        emptySelectionLabel={props.emptyLabel}
      />
    </div>
  );
}

//
// Helper function to build a map of excluded person IDs
// for the PeopleSearch component
//
// Using a map instead of an array for faster lookups
function buildExcludedIds(exclude?: People.Person[]): Record<string, boolean> {
  if (!exclude) return {};

  let res: { [id: string]: boolean } = {};

  exclude.forEach((p) => {
    res[p.id!] = true;
  });

  return res;
}

function useSearchFn(searchFn?: SearchFn): SearchFn {
  if (searchFn) {
    return searchFn;
  } else {
    return People.usePeopleSearch(People.CompanyWideSearchScope);
  }
}
