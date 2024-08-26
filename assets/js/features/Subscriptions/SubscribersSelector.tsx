import React, { useState } from "react";

import { useSubscriptionsContext, Options } from "./SubscriptionsContext";
import { useIsDarkMode } from "@/contexts/ThemeContext";

import classNames from "classnames";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";
import { Radio, RadioGroup } from "@/components/Form";
import { FilledButton } from "@/components/Button";
import { Person } from "@/models/people";


export function SubscribersSelector() {
  const [showSelector, setShowSelector] = useState(false);
  const {
    people,
    selectedPeople, setSelectedPeople,
    subscriptionType, setSubscriptionType,
  } = useSubscriptionsContext();

  const saveSelection = (ids: string[]) => {
    setSelectedPeople(people.filter(person => ids.includes(person.id!)));
    setShowSelector(false);
  }

  return (
    <div>
      <p className="text-lg font-bold mb-2">Who should be notified?</p>

      <RadioGroup name="privacy-level" onChange={setSubscriptionType} defaultValue={subscriptionType} >
        <Radio
          label={`All people who are members of the space`}
          value={Options.ALL}
        />
        <div className="my-1" onClick={() => setShowSelector(true)} >
          <Radio
            label={`Only the people I select`}
            value={Options.SELECTED}
          />
          <SelectedPeople people={selectedPeople} />
        </div>
        <Radio
          label="No one"
          value={Options.NONE}
        />
      </RadioGroup>

      <SelectorModal
        people={people}
        saveSelection={saveSelection}
        showSelector={showSelector}
        setShowSelector={setShowSelector}
      />
  </div>
  );
}


interface SelectorModal {
  people: Person[];
  saveSelection: (ids: string[]) => void;
  showSelector: boolean;
  setShowSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

function SelectorModal({people, saveSelection, showSelector, setShowSelector}: SelectorModal) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelectEveryone = () => {
    setSelected(people.map(person => person.id!));
  }

  const handleSelectNoone = () => {
    setSelected([]);
  }

  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(item => item !== id));
    } else {
      setSelected(prev => [...prev, id]);
    }
  }

  return (
    <Modal title="" isOpen={showSelector} hideModal={() => setShowSelector(false)} >
      <div className="flex flex-col gap-6">
        <div className="font-bold text-center text-lg">Select people to notify</div>

        <div className="flex items-center gap-3">
          <ActionText
            text="Select everyone"
            onClick={handleSelectEveryone}
          />
          <span className="text-[7px] content-accent">&#9830;</span>
          <ActionText
            text="Select no one"
            onClick={handleSelectNoone}
          />
        </div>

        <div>
          {people.map(person => (
            <div key={person.id} className="flex gap-4 border-b border-content-subtle px-2 pb-4 mb-4 last:border-0 last:mb-0">
              <Avatar person={person} size="large" />
              <div className="flex w-full items-center justify-between">
                <div>
                  <p className="font-bold">{person.fullName}</p>
                  <p className="text-sm">Some role</p>
                </div>
                <input
                  checked={selected.includes(person.id!)}
                  onChange={() => handleSelect(person.id!)}
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2">
          <FilledButton onClick={() => saveSelection(selected)} type="primary">Save selection</FilledButton>
          <FilledButton onClick={() => setShowSelector(false)} type="secondary">Never mind</FilledButton>
        </div>
      </div>
    </Modal>
  );
}


function SelectedPeople({people}) {
  if(people.length === 0) return <></>;

  return(
    <div className="flex gap-2 ml-6">
      {people.map(person => (
        <Avatar person={person} size="tiny" key={person.id} />
      ))}
    </div>
  );
}


function ActionText({text, onClick}) {
  const isDark = useIsDarkMode();

  return (
    <span
      className={classNames(
        isDark ? "text-blue-300" : "text-blue-700",
        "text-sm underline underline-offset-2 cursor-pointer"
      )}
      onClick={onClick}
    >
      {text}
    </span>
  );
}
