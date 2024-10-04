import React from "react";

import Avatar from "@/components/Avatar";
import { Subscriber } from "@/models/notifications";
import { compareIds, includesId } from "@/routes/paths";
import { useFieldValue } from "./FormContext";

interface MultiPeopleSelectFieldProps {
  field: string;
  options: Subscriber[];
  alwaysSelected: Subscriber[];
}

export function MultiPeopleSelectField(props: MultiPeopleSelectFieldProps) {
  const { field, options, alwaysSelected } = props;
  const alwaysSelectedIds = alwaysSelected.map((subscriber) => subscriber.person!.id!);

  return (
    <div>
      {alwaysSelected.map((subscriber) => (
        <PersonAlwaysSelected subscriber={subscriber} key={subscriber.person!.id} />
      ))}

      {options
        .filter((subscriber) => !includesId(alwaysSelectedIds, subscriber.person!.id))
        .map((subscriber) => (
          <PersonOption subscriber={subscriber} field={field} key={subscriber.person!.id} />
        ))}
    </div>
  );
}

function PersonAlwaysSelected({ subscriber }: { subscriber: Subscriber }) {
  return (
    <div className="flex gap-4 border-b border-bg-stroke-subtle px-2 pb-4 mb-4 last:border-0 last:mb-0">
      <Avatar person={subscriber.person!} size="large" />
      <div className="flex w-full items-center justify-between">
        <div className="text-content-dimmed">
          <p className="font-bold">{subscriber.person!.fullName}</p>
          <p className="text-sm">{subscriber.role} - will always be notified</p>
        </div>
      </div>
    </div>
  );
}

function PersonOption({ subscriber, field }: { subscriber: Subscriber; field: string }) {
  const [value, setValue] = useFieldValue<string[]>(field);
  const testId = "person-option-" + subscriber.person!.id;

  const handleChange = () => {
    if (includesId(value, subscriber.person!.id)) {
      setValue(value.filter((item) => !compareIds(item, subscriber.person!.id)));
    } else {
      setValue([...value, subscriber.person!.id!]);
    }
  };

  return (
    <div className="flex gap-4 border-b border-bg-stroke-subtle px-2 pb-4 mb-4 last:border-0 last:mb-0">
      <Avatar person={subscriber.person!} size="large" />
      <div className="flex w-full items-center justify-between">
        <div>
          <p className="font-bold">{subscriber.person!.fullName}</p>
          <p className="text-sm">{subscriber.role}</p>
        </div>
        <input
          checked={includesId(value, subscriber.person!.id)}
          onChange={handleChange}
          type="checkbox"
          className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          data-test-id={testId}
        />
      </div>
    </div>
  );
}
