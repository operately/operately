import React from "react";

import Forms from "@/components/Forms";
import { includesId } from "@/routes/paths";
import { PrimaryButton } from "@/components/Buttons";
import { ActionLink } from "@/components/Link";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

export function SubscribersSelectorForm({ closeForm, loading = false, callback }) {
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
      <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto">
        <div className="flex items-center gap-3">
          <ActionLink onClick={handleSelectEveryone}>Select everyone</ActionLink>
          <span className="text-content-dimmed">&middot;</span>
          <ActionLink onClick={handleSelectNoone}>Select no one</ActionLink>
        </div>

        <Forms.MultiPeopleSelectField field="people" />
      </div>

      <div className="flex justify-center gap-2">
        <PrimaryButton loading={loading} type="primary" submit>
          Save selection
        </PrimaryButton>
        <PrimaryButton onClick={closeForm} type="secondary">
          Never mind
        </PrimaryButton>
      </div>
    </Forms.Form>
  );
}
