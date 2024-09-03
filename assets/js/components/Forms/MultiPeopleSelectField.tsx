import React from "react";

import Avatar from "@/components/Avatar";
import { Person } from "@/models/people";
import { getFormContext } from "./FormContext";

export function MultiPeopleSelectField({ field }: { field: string }) {
  const form = getFormContext();
  const f = form.fields[field];

  return (
    <div>
      {f.options.map((person: Person) => (
        <PersonOption person={person} field={field} key={person.id} />
      ))}
    </div>
  );
}

function PersonOption({ person, field }: { person: Person; field: string }) {
  const form = getFormContext();
  const { value, setValue, alwaysSelected } = form.fields[field];

  const handleChange = () => {
    // if alwaysSelected includes the person,
    // handleChange doesn't do anything
    if (alwaysSelected.find((p) => p.id === person.id)) return;

    const ids = value.map((p) => p.id);

    if (ids.includes(person.id)) {
      setValue((prev: Person[]) => prev.filter((item) => item.id !== person.id));
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
          <p className="text-sm">{person.title}</p>
        </div>
        <input
          checked={value.map((p) => p.id).includes(person.id)}
          onChange={handleChange}
          type="checkbox"
          className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
