import React from "react";

import { Avatar } from "../Avatar";
import { SubscribersSelector } from "./SubscribersSelector";
import { SubscribersSelectorModal } from "./components/SubscribersSelectorModal";
import { sortSubscribersByName } from "./utils";

export namespace CommentSubscribersSelector {
  export interface Props {
    subscribers: SubscribersSelector.Subscriber[];
    selectedSubscriberIds: string[];
    onSelectedSubscriberIdsChange: (subscriberIds: string[]) => void;
    alwaysNotify?: SubscribersSelector.Subscriber[];
    label?: string;
    helperText?: string;
    triggerLabel?: string;
  }
}

const DEFAULT_LABEL = "Notify";
const DEFAULT_TRIGGER_LABEL = "Select people to notify";
const DEFAULT_HELPER_TEXT = "Choose who should be notified when this is posted.";

export function CommentSubscribersSelector({
  subscribers,
  selectedSubscriberIds,
  onSelectedSubscriberIdsChange,
  alwaysNotify,
  label = DEFAULT_LABEL,
  helperText = DEFAULT_HELPER_TEXT,
  triggerLabel = DEFAULT_TRIGGER_LABEL,
}: CommentSubscribersSelector.Props) {
  const [showModal, setShowModal] = React.useState(false);

  const resolvedAlwaysNotify = React.useMemo(() => {
    if (alwaysNotify && alwaysNotify.length > 0) return alwaysNotify;
    return subscribers.filter((subscriber) => subscriber.priority);
  }, [alwaysNotify, subscribers]);

  const alwaysNotifyIds = React.useMemo(() => {
    return new Set<string>(
      resolvedAlwaysNotify
        .map((subscriber) => subscriber.person?.id || "")
        .filter((id): id is string => Boolean(id)),
    );
  }, [resolvedAlwaysNotify]);

  const selectedIdsWithAlways = React.useMemo(() => {
    const ids = new Set(selectedSubscriberIds.filter(Boolean));
    alwaysNotifyIds.forEach((id) => ids.add(id));
    return ids;
  }, [selectedSubscriberIds, alwaysNotifyIds]);

  const selectedSubscribers = React.useMemo(() => {
    return subscribers.filter((subscriber) => {
      const personId = subscriber.person?.id;
      if (!personId) return false;
      return selectedIdsWithAlways.has(personId);
    });
  }, [subscribers, selectedIdsWithAlways]);

  const sortedSelectedSubscribers = React.useMemo(
    () => sortSubscribersByName(selectedSubscribers),
    [selectedSubscribers],
  );

  const handleSaveSelection = (selected: SubscribersSelector.Subscriber[]) => {
    const nextIds = new Set<string>();

    selected.forEach((subscriber) => {
      const id = subscriber.person?.id;
      if (id) nextIds.add(id);
    });

    resolvedAlwaysNotify.forEach((subscriber) => {
      const id = subscriber.person?.id;
      if (id) nextIds.add(id);
    });

    onSelectedSubscriberIdsChange(Array.from(nextIds));
  };

  if (subscribers.length === 0) return null;

  return (
    <div>
      {label && <p className="font-bold mb-1.5">{label}</p>}

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full text-left border border-stroke-base rounded-lg px-4 py-3 transition-colors focus:outline-none"
      >
        <div className="font-medium text-content-accent">{triggerLabel}</div>
        {helperText && <div className="text-sm text-content-dimmed mt-0.5">{helperText}</div>}
      </button>

      <SelectedPeopleList subscribers={sortedSelectedSubscribers} alwaysNotifyIds={alwaysNotifyIds} />

      <SubscribersSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        subscribers={subscribers}
        selectedSubscribers={selectedSubscribers}
        alwaysNotify={resolvedAlwaysNotify}
        onSave={handleSaveSelection}
      />
    </div>
  );
}

interface SelectedPeopleListProps {
  subscribers: SubscribersSelector.Subscriber[];
  alwaysNotifyIds: Set<string>;
}

function SelectedPeopleList({ subscribers, alwaysNotifyIds }: SelectedPeopleListProps) {
  if (subscribers.length === 0) {
    return <p className="text-sm text-content-dimmed mt-3">No one selected yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2 mt-3" data-test-id="selected-notification-recipients">
      {subscribers.map((subscriber) => {
        if (!subscriber.person) return null;

        const isAlwaysNotify = alwaysNotifyIds.has(subscriber.person.id);

        return (
          <div key={subscriber.person.id} className="flex items-center gap-2">
            <Avatar person={subscriber.person} size="tiny" />
            <span className="text-sm text-content-accent">{subscriber.person.fullName}</span>
            {isAlwaysNotify && <span className="text-xs text-content-subtle">(Always notified)</span>}
          </div>
        );
      })}
    </div>
  );
}
