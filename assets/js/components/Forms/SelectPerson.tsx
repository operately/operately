import * as React from "react";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { SelectPersonField } from "./useSelectPersonField";
import { useFieldValue, useFieldError } from "./FormContext";

import PeopleSearch, { Option } from "@/components/PeopleSearch";

interface SelectPersonProps {
  field: string;
  label?: string;
  hidden?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  searchFn: SelectPersonField["searchFn"];
  exclude?: People.Person[];
}

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

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);
  const loader = searchFn;

  const onChange = (option: Option | null) => {
    setValue(option?.value);
  };

  const excludedIds = buildExcludedIds(exclude);

  return (
    <div className="flex-1">
      <PeopleSearch
        inputId={props.field}
        onChange={onChange}
        placeholder="Search for person..."
        defaultValue={value!}
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
