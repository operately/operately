import { Subscriber } from "@/models/notifications";

/**
 * Sorts subscribers by their person's full name in alphabetical order.
 * Uses locale-aware comparison for proper Unicode string sorting.
 * 
 * @param subscribers Array of Subscriber objects to sort
 * @returns New array with subscribers sorted by person.fullName
 */
export function sortSubscribersByName(subscribers: Subscriber[]): Subscriber[] {
  return [...subscribers].sort((a, b) => {
    const nameA = a.person?.fullName || "";
    const nameB = b.person?.fullName || "";
    return nameA.localeCompare(nameB);
  });
}