import React, { useState } from "react";
import { Modal } from "../../Modal";
import type { SubscribersSelector } from "../SubscribersSelector";
import { sortSubscribersByName } from "../utils";
import { Avatar } from "../../Avatar";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { ActionLink } from "../../Link";
import { Checkbox } from "../../Checkbox";
import { IconX } from "../../icons";

interface SubscribersSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: SubscribersSelector.Subscriber[];
  selectedSubscribers: SubscribersSelector.Subscriber[];
  alwaysNotify: SubscribersSelector.Subscriber[];
  onSave: (selected: SubscribersSelector.Subscriber[]) => void;
}

export function SubscribersSelectorModal({
  isOpen,
  onClose,
  subscribers,
  selectedSubscribers,
  alwaysNotify,
  onSave,
}: SubscribersSelectorModalProps) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(
    new Set(selectedSubscribers.map((s) => s.person?.id || "").filter(Boolean)),
  );

  const alwaysNotifyIds = new Set(alwaysNotify.map((s) => s.person?.id || "").filter(Boolean));

  const handleToggle = (personId: string) => {
    const newSelected = new Set(localSelected);
    if (newSelected.has(personId)) {
      newSelected.delete(personId);
    } else {
      newSelected.add(personId);
    }
    setLocalSelected(newSelected);
  };

  const handleSelectEveryone = () => {
    setLocalSelected(new Set(subscribers.map((s) => s.person?.id || "").filter(Boolean)));
  };

  const handleSelectNoOne = () => {
    setLocalSelected(new Set(alwaysNotify.map((s) => s.person?.id || "").filter(Boolean)));
  };

  const handleSave = () => {
    const selected = subscribers.filter((s) => localSelected.has(s.person?.id || ""));
    onSave(selected);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      setLocalSelected(new Set(selectedSubscribers.map((s) => s.person?.id || "").filter(Boolean)));
    }
  }, [isOpen, selectedSubscribers]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="flex flex-col" data-test-id="subscribers-selection-modal">
        <ModalHeader onClose={onClose} />

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <ActionLink onClick={handleSelectEveryone} testId="select-everyone">
              Select everyone
            </ActionLink>
            <span className="text-content-dimmed">&middot;</span>
            <ActionLink onClick={handleSelectNoOne} testId="select-no-one">
              Select no one
            </ActionLink>
          </div>

          <SubscribersList
            subscribers={subscribers}
            localSelected={localSelected}
            alwaysNotifyIds={alwaysNotifyIds}
            onToggle={handleToggle}
          />

          <div className="flex gap-2">
            <PrimaryButton onClick={handleSave} testId="submit">
              Save selection
            </PrimaryButton>
            <SecondaryButton onClick={onClose} testId="cancel">
              Never mind
            </SecondaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface ModalHeaderProps {
  onClose: () => void;
}

function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">Select people to notify</h2>
      <button
        onClick={onClose}
        className="text-content-dimmed hover:text-content-accent transition-colors"
        aria-label="Close"
      >
        <IconX size={24} />
      </button>
    </div>
  );
}

interface SubscribersListProps {
  subscribers: SubscribersSelector.Subscriber[];
  localSelected: Set<string>;
  alwaysNotifyIds: Set<string>;
  onToggle: (personId: string) => void;
}

function SubscribersList({ subscribers, localSelected, alwaysNotifyIds, onToggle }: SubscribersListProps) {
  return (
    <div className="max-h-[380px] overflow-y-auto">
      <div className="flex flex-col">
        {sortSubscribersByName(subscribers).map((subscriber) => {
          if (!subscriber.person) return null;
          const personId = subscriber.person.id;
          const isAlwaysNotify = alwaysNotifyIds.has(personId);
          const isChecked = localSelected.has(personId);

          return (
            <label
              key={personId}
              className="flex items-center gap-3 py-3 px-2 cursor-pointer border-b border-stroke-base last:border-b-0"
              data-test-id={`person-option-${personId}`}
            >
              <Avatar person={subscriber.person} size="small" />
              <div className="flex-1">
                <div className="font-medium text-content-accent">{subscriber.person.fullName}</div>
                {subscriber.person.title && <div className="text-sm text-content-dimmed">{subscriber.person.title}</div>}
                {isAlwaysNotify && <div className="text-xs text-content-subtle mt-0.5">(Always notified)</div>}
              </div>
              <Checkbox checked={isChecked} onChange={() => !isAlwaysNotify && onToggle(personId)} disabled={isAlwaysNotify} />
            </label>
          );
        })}
      </div>
    </div>
  );
}
