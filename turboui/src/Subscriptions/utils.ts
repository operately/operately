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
 * Checks if a subscriber is in a list of subscribers by comparing person IDs.
 */
export function isSubscriberInList(list: SubscribersSelector.Subscriber[], subscriber: SubscribersSelector.Subscriber): boolean {
  return list.some((item) => item.person?.id === subscriber.person?.id);
}
