import React, { useState } from "react";
import { Modal } from "../../Modal";
import type { SubscribersSelector } from "../SubscribersSelector";
import { sortSubscribers } from "../utils";
import { Avatar } from "../../Avatar";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { ActionLink } from "../../Link";
import { Checkbox } from "../../Checkbox";
import { IconSearch, IconX } from "../../icons";

interface SubscribersSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribers: SubscribersSelector.Subscriber[];
  selectedSubscribers: SubscribersSelector.Subscriber[];
  alwaysNotify: SubscribersSelector.Subscriber[];
  onSave: (selected: SubscribersSelector.Subscriber[]) => void;
  alwaysNotifyLabel?: string;
}

export function SubscribersSelectorModal({
  isOpen,
  onClose,
  subscribers,
  selectedSubscribers,
  alwaysNotify,
  onSave,
  alwaysNotifyLabel = "Always notified",
}: SubscribersSelectorModalProps) {
  const [localSelected, setLocalSelected] = useState<Set<string>>(
    new Set(selectedSubscribers.map((s) => s.person?.id || "").filter(Boolean)),
  );
  const [searchTerm, setSearchTerm] = useState("");

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
      setSearchTerm("");
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

          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-dimmed" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find people"
              aria-label="Find people"
              className="w-full rounded-md border border-surface-outline bg-surface-base py-2 pl-9 pr-3 text-sm text-content-accent placeholder:text-content-dimmed focus:outline-none focus:ring-2 focus:ring-brand-1"
            />
          </div>

          <SubscribersList
            subscribers={subscribers}
            searchTerm={searchTerm}
            localSelected={localSelected}
            alwaysNotifyIds={alwaysNotifyIds}
            onToggle={handleToggle}
            alwaysNotifyLabel={alwaysNotifyLabel}
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
  searchTerm: string;
  localSelected: Set<string>;
  alwaysNotifyIds: Set<string>;
  onToggle: (personId: string) => void;
  alwaysNotifyLabel: string;
}

function SubscribersList({
  subscribers,
  searchTerm,
  localSelected,
  alwaysNotifyIds,
  onToggle,
  alwaysNotifyLabel,
}: SubscribersListProps) {
  const sortedSubscribers = React.useMemo(
    () => sortSubscribers(subscribers, alwaysNotifyIds),
    [subscribers, alwaysNotifyIds],
  );
  const filteredSubscribers = React.useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearchTerm) return sortedSubscribers;

    return sortedSubscribers.filter((subscriber) =>
      subscriber.person?.fullName.toLocaleLowerCase().includes(normalizedSearchTerm),
    );
  }, [sortedSubscribers, searchTerm]);

  return (
    <div className="max-h-[380px] overflow-y-auto">
      <div className="flex flex-col">
        {filteredSubscribers.map((subscriber) => {
          if (!subscriber.person) return null;
          const personId = subscriber.person.id;
          const isAlwaysNotify = alwaysNotifyIds.has(personId);
          const isChecked = localSelected.has(personId);

          return (
            <div
              key={personId}
              className="flex items-center gap-3 py-3 px-2 cursor-pointer border-b border-stroke-base last:border-b-0"
              data-test-id={`person-option-${personId}`}
              onClick={() => !isAlwaysNotify && onToggle(personId)}
            >
              <Avatar person={subscriber.person} size="small" />
              <div className="flex-1">
                <div className="font-medium text-content-accent">{subscriber.person.fullName}</div>
                {subscriber.role && (
                  <div className="text-sm text-content-dimmed">
                    {subscriber.role}
                    {isAlwaysNotify ? ` - ${alwaysNotifyLabel}` : ""}
                  </div>
                )}
              </div>
              <Checkbox
                checked={isChecked}
                onChange={() => !isAlwaysNotify && onToggle(personId)}
                disabled={isAlwaysNotify}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
