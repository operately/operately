import { useCallback, useMemo, useState } from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Subscriber, Subscription } from "@/models/notifications";
import { compareIds } from "@/routes/paths";
import { CommentSubscribersSelector } from "turboui";

interface Options {
  initialSelectedIds?: string[];
  initialSubscriptions?: Subscription[];
  ignoreMe?: boolean;
  lockAlwaysNotify?: boolean;
}

/**
 * Adapter hook that prepares data for the CommentSubscribersSelector component.
 * Keeps "always notified" people included while exposing both subscriber objects and IDs.
 */
export function useCommentSubscriptionsAdapter(
  allSubscribers: Subscriber[],
  opts: Options = {},
): CommentSubscribersSelector.Props {
  const me = useMe();
  const { initialSelectedIds, initialSubscriptions, ignoreMe, lockAlwaysNotify } = opts;

  const subscribers = useMemo(() => {
    if (!ignoreMe || !me) return allSubscribers;
    return allSubscribers.filter((subscriber) => !compareIds(subscriber.person?.id, me.id));
  }, [allSubscribers, ignoreMe, me]);

  const alwaysNotify = useMemo(() => subscribers.filter((subscriber) => subscriber.priority), [subscribers]);

  const subscriberIdsSet = useMemo(() => {
    const ids = new Set<string>();
    for (const subscriber of subscribers) {
      const id = subscriber.person?.id;
      if (id) ids.add(id);
    }
    return ids;
  }, [subscribers]);

  const initialSelected = useMemo(() => {
    const ids = new Set<string>();

    // Add base initial IDs
    if (initialSelectedIds) {
      for (const id of initialSelectedIds) {
        if (id && subscriberIdsSet.has(id)) ids.add(id);
      }
    } else if (initialSubscriptions) {
      for (const subscription of initialSubscriptions) {
        const id = subscription.person?.id;
        if (id && subscriberIdsSet.has(id)) ids.add(id);
      }
    }

    // Add always notify IDs
    for (const subscriber of alwaysNotify) {
      const id = subscriber.person?.id;
      if (id) ids.add(id);
    }

    return Array.from(ids);
  }, [initialSelectedIds, initialSubscriptions, alwaysNotify, subscriberIdsSet]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const handleChange = useCallback(
    (ids: string[]) => {
      const nextIds = new Set<string>();

      // Add valid IDs from input
      for (const id of ids) {
        if (id && subscriberIdsSet.has(id)) nextIds.add(id);
      }

      // Lock always notify if enabled
      if (lockAlwaysNotify !== false) {
        for (const subscriber of alwaysNotify) {
          const id = subscriber.person?.id;
          if (id) nextIds.add(id);
        }
      }

      setSelectedIds(Array.from(nextIds));
    },
    [alwaysNotify, lockAlwaysNotify, subscriberIdsSet],
  );

  return {
    subscribers,
    selectedSubscriberIds: selectedIds,
    alwaysNotify,
    onSelectedSubscriberIdsChange: handleChange,
  };
}
