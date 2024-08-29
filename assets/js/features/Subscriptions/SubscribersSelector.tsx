import React, { useState, useMemo } from "react";

import { useSubscriptionsContext, Options } from "./SubscriptionsContext";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { Radio, RadioGroup } from "@/components/Form";
import { FilledButton } from "@/components/Button";
import { ActionLink } from "@/components/Link";
import { Person } from "@/models/people";

export function SubscribersSelector({ labelSuffix }: { labelSuffix: string }) {
  const [showSelector, setShowSelector] = useState(false);
  const { people, selectedPeople, subscriptionType, setSubscriptionType } = useSubscriptionsContext();

  const selectedPeopleLabel = useMemo(() => {
    switch (selectedPeople.length) {
      case 0:
        return "Only the people I select";
      case 1:
        return "Only the following person I selected";
      default:
        return `Only the following ${selectedPeople.length} people I selected`;
    }
  }, [selectedPeople]);

  return (
    <div>
      <p className="text-lg font-bold mb-2">When I post this, notify:</p>

      <RadioGroup name="subscriptions-options" onChange={setSubscriptionType} defaultValue={subscriptionType}>
        <SubscriptionOption
          label={`All ${people.length} people who are ${labelSuffix}`}
          value={Options.ALL}
          people={people}
        />

        <SubscriptionOption
          label={selectedPeopleLabel}
          value={Options.SELECTED}
          people={selectedPeople}
          onClick={() => setShowSelector(true)}
        />

        <SubscriptionOption label="No one" value={Options.NONE} people={[]} />
      </RadioGroup>

      <SelectorModal showSelector={showSelector} setShowSelector={setShowSelector} />
    </div>
  );
}

interface SubscriptionOptionProps {
  label: string;
  value: Options;
  people: Person[];
  onClick?: () => void;
}

function SubscriptionOption({ label, value, people, onClick }: SubscriptionOptionProps) {
  const { subscriptionType } = useSubscriptionsContext();

  return (
    <div className="my-1" onClick={onClick}>
      <Radio label={label} value={value} />
      <SelectedPeople people={people} hide={subscriptionType !== value} />
    </div>
  );
}

function SelectedPeople({ people, hide }) {
  if (people.length === 0 || hide) return <></>;

  return (
    <div className="flex flex-wrap gap-2 ml-6">
      {people.map((person) => (
        <Avatar person={person} size="tiny" key={person.id} />
      ))}
    </div>
  );
}

interface SelectorModalProps {
  showSelector: boolean;
  setShowSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

function SelectorModal({ showSelector, setShowSelector }: SelectorModalProps) {
  const { people, setSelectedPeople } = useSubscriptionsContext();

  const form = Forms.useForm({
    fields: {
      people: Forms.useMultiPeopleSelectField(people, { optional: true }),
    },
    submit: async (form) => {
      setSelectedPeople(people.filter((person) => form.fields.people.value!.includes(person)));
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
