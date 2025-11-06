import React from "react";

import { AvatarList } from "../Avatar";
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
  }
}

const DEFAULT_LABEL = "People who will be notified:";

export function CommentSubscribersSelector({
  subscribers,
  selectedSubscriberIds,
  onSelectedSubscriberIdsChange,
  alwaysNotify,
  label = DEFAULT_LABEL,
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
      {label && <div className="text-sm text-content-dimmed font-medium mb-1">{label}</div>}
      <div className="flex items-center gap-1 flex-wrap">
        <AvatarList people={sortedSelectedSubscribers.map((s) => s.person!)} size="tiny" />
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-6 h-6 rounded-full border-2 border-dashed border-stroke-base hover:border-stroke-dimmed flex items-center justify-center text-content-dimmed hover:text-content-base transition-colors focus:outline-none"
          aria-label="Add people to notify"
        >
          +
        </button>
      </div>

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

