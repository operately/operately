import { WorkMap } from "..";

/**
 * Custom hook to calculate status flags for WorkMap items
 */
export function useItemStatus(status: WorkMap.Status) {
  const isCompleted =
    status === "completed" ||
    status === "achieved" ||
    status === "partial" ||
    status === "missed";

  const isFailed = status === "missed";
  const isDropped = status === "dropped";
  const isPending = status === "pending";

  return {
    isCompleted,
    isFailed,
    isDropped,
    isPending,
  };
}
