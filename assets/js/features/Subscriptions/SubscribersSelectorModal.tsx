import React, { useContext } from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { FilledButton } from "@/components/Button";
import { ActionLink } from "@/components/Link";
import { SubscriptionsContext } from "./SubscribersSelector";

interface SelectorModalProps {
  showSelector: boolean;
  setShowSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SubscribersSelectorModal({ showSelector, setShowSelector }: SelectorModalProps) {
  const { people, setSelectedPeople } = useContext(SubscriptionsContext)!;

  const form = Forms.useForm({
    fields: {
      people: Forms.useMultiPeopleSelectField(people, { optional: true }),
    },
    submit: async (form) => {
      const selectedPeopleIds = form.fields.people.value!.map((p) => p.id);
      setSelectedPeople(people.filter((person) => selectedPeopleIds.includes(person.id)));
      setShowSelector(false);
    },
  });
  const { options, setValue } = form.fields.people;

  const handleSelectNoone = () => {
    setValue([]);
  };

  const handleSelectEveryone = () => {
    setValue(options.map((person) => person));
  };

  return (
    <Modal
      title="Select people to notify"
      isOpen={showSelector}
      hideModal={() => setShowSelector(false)}
      minHeight="200px"
    >
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
          <FilledButton type="primary" submit>
            Save selection
          </FilledButton>
          <FilledButton onClick={() => setShowSelector(false)} type="secondary">
            Never mind
          </FilledButton>
        </div>
      </Forms.Form>
    </Modal>
  );
}
