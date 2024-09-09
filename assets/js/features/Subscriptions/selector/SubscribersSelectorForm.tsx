import React from "react";

import Forms from "@/components/Forms";
import { includesId } from "@/routes/paths";
import { ActionLink } from "@/components/Link";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

export function SubscribersSelectorForm({ closeForm, callback }) {
  const { people, alwaysNotify, setSelectedPeople, selectedPeople } = useSubscribersSelectorContext();

  const form = Forms.useForm({
    fields: {
      people: Forms.useMultiPeopleSelectField(people, {
        optional: true,
        alwaysSelected: alwaysNotify,
        alreadySelected: selectedPeople,
      }),
    },
    submit: async (form) => {
      const selectedPeopleIds = form.fields.people.value!.map((p) => p.id);
      setSelectedPeople(people.filter((person) => includesId(selectedPeopleIds, person.id)));

      if (callback) {
        callback(form);
      }
    },
    cancel: closeForm,
  });

  const { options, setValue } = form.fields.people;

  const handleSelectNoone = () => {
    setValue([...alwaysNotify]);
  };

  const handleSelectEveryone = () => {
    setValue(options.map((person) => person));
  };

  return (
    <Forms.Form form={form}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <ActionLink onClick={handleSelectEveryone}>Select everyone</ActionLink>
          <span className="text-content-dimmed">&middot;</span>
          <ActionLink onClick={handleSelectNoone}>Select no one</ActionLink>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          <Forms.MultiPeopleSelectField field="people" />
        </div>
        <Forms.Submit saveText="Save selection" cancelText="Never mind" />
      </div>
    </Forms.Form>
  );
}
