import { parse } from "../../utils/time";
import WorkMap from "../components";

/**
 * Helper function to sort items by their completedOn date in descending order
 */
export function sortItemsByClosedDate(items: WorkMap.Item[]): WorkMap.Item[] {
  return [...items].sort((a, b) => {
    const dateA = parse((a as any).completedOn);
    const dateB = parse((b as any).completedOn);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // If A is null, B comes first
    if (!dateB) return -1; // If B is null, A comes first

    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Helper function to sort items by their due date (timeframe.endDate) in ascending order
 * If items have the same due date, they are sorted by name
 */
export function sortItemsByDueDate(items: WorkMap.Item[]): WorkMap.Item[] {
  return [...items].sort((a, b) => {
    const dateA = parse(a.timeframe?.endDate?.date);
    const dateB = parse(b.timeframe?.endDate?.date);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // Items without due dates come last
    if (!dateB) return -1; // Items with due dates come first

    const dateCompare = dateA.getTime() - dateB.getTime();
    if (dateCompare !== 0) return dateCompare;

    return (a.name || "").localeCompare(b.name || "");
  });
}

/**
 * Helper function to sort items by their duration in descending order (longer duration first)
 * If items have the same duration, they are sorted by name
 */
export function sortItemsByDuration(items: WorkMap.Item[]): WorkMap.Item[] {
  return [...items].sort((a, b) => {
    const durationA = getDuration(a);
    const durationB = getDuration(b);

    // Items with both dates come first
    if (durationA !== null && durationB !== null) {
      const durationCompare = durationB - durationA;
      if (durationCompare !== 0) return durationCompare;
    }

    if (durationA === null) return 1; // Items without duration come last
    if (durationB === null) return -1; // Items with duration come first

    return (a.name || "").localeCompare(b.name || "");
  });
}

function getDuration(item: WorkMap.Item): number | null {
  const start = parse(item.timeframe?.startDate?.date);
  const end = parse(item.timeframe?.endDate?.date);

  // Calculate duration only if both dates exist and are valid (end is after start)
  return start && end && end > start ? end.getTime() - start.getTime() : null;
}
