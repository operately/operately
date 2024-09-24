import React from "react";

import Avatar from "@/components/Avatar";
import { Person } from "@/models/people";
import { compareIds, includesId } from "@/routes/paths";
import { NotifiablePerson } from "@/features/Subscriptions";
import { useFieldValue } from "./FormContext";

interface MultiPeopleSelectFieldProps {
  field: string;
  options: (Person | NotifiablePerson)[];
  alwaysSelected: Person[];
}

export function MultiPeopleSelectField(props: MultiPeopleSelectFieldProps) {
  const { field, options, alwaysSelected } = props;
  const alwaysSelectedIds = alwaysSelected.map((p) => p.id!);

  return (
    <div>
      {alwaysSelected.map((person) => (
        <PersonAlwaysSelected person={person} key={person.id} />
      ))}

      {options
        .filter((person) => !includesId(alwaysSelectedIds, person.id))
        .map((person) => (
          <PersonOption person={person} field={field} key={person.id} />
        ))}
    </div>
  );
}

function PersonAlwaysSelected({ person }: { person: Person }) {
  return (
    <div className="flex gap-4 border-b border-bg-stroke-subtle px-2 pb-4 mb-4 last:border-0 last:mb-0">
      <Avatar person={person} size="large" />
      <div className="flex w-full items-center justify-between">
        <div className="text-content-dimmed">
          <p className="font-bold">{person.fullName}</p>
          <p className="text-sm">{getTitleOrRole(person)} - will always be notified</p>
        </div>
      </div>
    </div>
  );
}

function PersonOption({ person, field }: { person: Person | NotifiablePerson; field: string }) {
  const [value, setValue] = useFieldValue(field);

  const handleChange = () => {
    const ids = value.map((p) => p.id);

    if (includesId(ids, person.id)) {
      setValue((prev: Person[]) => prev.filter((item) => !compareIds(item.id, person.id)));
    } else {
      setValue((prev: Person[]) => [...prev, person]);
    }
  };

  return (
    <div className="flex gap-4 border-b border-bg-stroke-subtle px-2 pb-4 mb-4 last:border-0 last:mb-0">
      <Avatar person={person} size="large" />
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="font-bold">{person.fullName}</p>
          <p className="text-sm">{getTitleOrRole(person)}</p>
        </div>
        <input
          checked={includesId(
            value.map((p) => p.id),
            person.id,
          )}
          onChange={handleChange}
          type="checkbox"
          className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

const getTitleOrRole = (person: Person | NotifiablePerson) => {
  if ("role" in person) {
    return person.role;
  } else if ("title" in person) {
    return person.title;
  } else {
    return "";
  }
};
