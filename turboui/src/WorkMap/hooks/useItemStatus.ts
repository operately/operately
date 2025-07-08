import { WorkMap } from "..";

/**
 * Custom hook to calculate status flags for WorkMap items
 */
export function useItemStatus(status: WorkMap.Item["status"]) {
  const isCompleted =
    status === "achieved" ||
    status === "missed";

  const isFailed = status === "missed";
  const isPending = status === "pending";

  return {
    isCompleted,
    isFailed,
    isPending,
  };
}
