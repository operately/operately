import { Status } from "../../types";

/**
 * Custom hook to calculate status flags for WorkMap items
 */
export function useItemStatus(status: Status) {
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
