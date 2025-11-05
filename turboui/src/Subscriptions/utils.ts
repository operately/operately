import type { SubscribersSelector } from "./SubscribersSelector";

/**
 * Sorts subscribers by their person's full name in alphabetical order.
 * Uses locale-aware comparison for proper Unicode string sorting.
 */
export function sortSubscribersByName(subscribers: SubscribersSelector.Subscriber[]): SubscribersSelector.Subscriber[] {
  return [...subscribers].sort((a, b) => {
    const nameA = a.person?.fullName || "";
    const nameB = b.person?.fullName || "";
    return nameA.localeCompare(nameB);
  });
}

/**
 * Sorts subscribers with optional priority for "always notified" people.
 * If alwaysNotifyIds is provided, those people appear first, then all others alphabetically.
 * Uses locale-aware comparison for proper Unicode string sorting.
 */
export function sortSubscribers(
  subscribers: SubscribersSelector.Subscriber[],
  alwaysNotifyIds?: Set<string>,
): SubscribersSelector.Subscriber[] {
  return [...subscribers].sort((a, b) => {
    const aId = a.person?.id || "";
    const bId = b.person?.id || "";

    // If alwaysNotifyIds is provided, prioritize those people
    if (alwaysNotifyIds) {
      const aIsAlwaysNotify = alwaysNotifyIds.has(aId);
      const bIsAlwaysNotify = alwaysNotifyIds.has(bId);

      if (aIsAlwaysNotify && !bIsAlwaysNotify) return -1;
      if (!aIsAlwaysNotify && bIsAlwaysNotify) return 1;
    }

    // Otherwise sort alphabetically
    const nameA = a.person?.fullName || "";
    const nameB = b.person?.fullName || "";
    return nameA.localeCompare(nameB);
  });
}

/**
 * Checks if a subscriber is in a list of subscribers by comparing person IDs.
 */
export function isSubscriberInList(list: SubscribersSelector.Subscriber[], subscriber: SubscribersSelector.Subscriber): boolean {
  return list.some((item) => item.person?.id === subscriber.person?.id);
}
