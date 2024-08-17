import * as React from "react";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { SelectPersonField } from "./useSelectPersonField";
import { getFormContext } from "./FormContext";

import PeopleSearch from "@/components/PeopleSearch";

export function SelectPerson({ field, label, hidden }: { field: string; label?: string; hidden?: boolean }) {
  const form = getFormContext();
  const error = form.errors[field];

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <SelectPersonInput field={field} />
    </InputField>
  );
}

function SelectPersonInput({ field }: { field: string }) {
  const form = getFormContext();
  const f = form.fields[field] as SelectPersonField;
  const error = form.errors[field];

  const loader = People.usePeopleSearch();

  const onChange = (option: { person: People.Person } | null) => {
    f.setValue(option?.person);
  };

  return (
    <div className="flex-1">
      <PeopleSearch onChange={onChange} placeholder="Search for person..." loader={loader} error={!!error} />
    </div>
  );
}
