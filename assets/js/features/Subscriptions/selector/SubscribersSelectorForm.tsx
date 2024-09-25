import * as React from "react";
import * as People from "@/models/people";

import Forms from "@/components/Forms";
import { includesId } from "@/routes/paths";
import { ActionLink } from "@/components/Link";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

export function SubscribersSelectorForm({ closeForm, callback }) {
  const { people, alwaysNotify, setSelectedPeople } = useSubscribersSelectorContext();

  const form = Forms.useForm({
    fields: {
      people: people.map((p) => p.id!),
    },
    submit: async () => {
      setSelectedPeople(people.filter((person) => includesId(form.values.people, person.id)));
      if (callback) callback(form);
    },
    cancel: closeForm,
  });

  return (
    <Forms.Form form={form}>
      <div className="flex flex-col gap-6">
        <ActionLinks alwaysNotify={alwaysNotify} allPeople={people} />

        <div className="max-h-[380px] overflow-y-auto">
          <Forms.MultiPeopleSelectField field="people" options={people} alwaysSelected={alwaysNotify} />
        </div>
        <Forms.Submit saveText="Save selection" cancelText="Never mind" />
      </div>
    </Forms.Form>
  );
}

function ActionLinks({ alwaysNotify, allPeople }: { alwaysNotify: People.Person[]; allPeople: People.Person[] }) {
  const [_, setValue] = Forms.useFieldValue<string[]>("people");

  const handleSelectNoone = () => {
    setValue([...alwaysNotify.map((p) => p.id!)]);
  };

  const handleSelectEveryone = () => {
    setValue([...allPeople.map((p) => p.id!)]);
  };

  return (
    <div className="flex items-center gap-3">
      <ActionLink onClick={handleSelectEveryone}>Select everyone</ActionLink>
      <span className="text-content-dimmed">&middot;</span>
      <ActionLink onClick={handleSelectNoone}>Select no one</ActionLink>
    </div>
  );
}
