import * as React from "react";

import Api from "@/api";
import { PageCache } from "@/routes/PageCache";
import { showErrorToast, TaskBoard } from "turboui";

interface UseProjectMilestoneOrderingOptions {
  projectId: string;
  cacheKey: string;
  refresh?: () => Promise<void>;
  initialMilestones: TaskBoard.Milestone[];
  initialOrderingState: string[];
}

interface UseProjectMilestoneOrderingResult {
  milestones: TaskBoard.Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<TaskBoard.Milestone[]>>;
  orderingState: string[];
  reorderMilestones: (sourceId: string, destinationIndex: number) => Promise<void>;
}

// useProjectMilestoneOrdering does the following: 
//    1) caches the original milestones/order in a ref so normalization only happens once, 
//       then seeds React state for ordered milestones and the current ordering array.
//    2) orderingRef mirrors the latest order to keep synchronous reads in callbacks aligned with async React updates, 
//       while setMilestones normalizes incoming lists and only mutates ordering state when values actually change.
//    3) reorderMilestones performs optimistic moves: it shifts the requested id, updates UI state immediately, calls the API, 
//       reconciles with the server response, and rolls back with a toast on failure while also invalidating cache/refreshing 
//       when successful.
export function useProjectMilestoneOrdering({
  projectId,
  cacheKey,
  refresh,
  initialMilestones,
  initialOrderingState,
}: UseProjectMilestoneOrderingOptions): UseProjectMilestoneOrderingResult {
  const initialDataRef = React.useRef<{ milestones: TaskBoard.Milestone[]; ordering: string[] } | null>(null);

  if (!initialDataRef.current) {
    const ordering = normalizeMilestoneOrdering(initialOrderingState, initialMilestones);
    initialDataRef.current = {
      milestones: reorderMilestonesByIds(initialMilestones, ordering),
      ordering,
    };
  }

  const [milestones, setMilestonesState] = React.useState<TaskBoard.Milestone[]>(initialDataRef.current.milestones);
  const [orderingState, setOrderingState] = React.useState<string[]>(initialDataRef.current.ordering);

  const orderingRef = React.useRef(orderingState);

  React.useEffect(() => {
    orderingRef.current = orderingState;
  }, [orderingState]);

  const setMilestones = React.useCallback<React.Dispatch<React.SetStateAction<TaskBoard.Milestone[]>>>(
    (update) => {
      setMilestonesState((prev) => {
        const next =
          typeof update === "function" ? (update as (value: TaskBoard.Milestone[]) => TaskBoard.Milestone[])(prev) : update;
        const normalized = normalizeMilestoneOrdering(orderingRef.current, next);

        setOrderingState((prevOrdering) => (arraysEqual(prevOrdering, normalized) ? prevOrdering : normalized));

        return reorderMilestonesByIds(next, normalized);
      });
    },
  []);

  const reorderMilestones = React.useCallback(
    async (sourceId: string, destinationIndex: number) => {
      const currentOrder = orderingRef.current;
      const updatedOrder = moveMilestoneId(currentOrder, sourceId, destinationIndex);

      if (!updatedOrder) {
        return;
      }

      // Capture snapshots before optimistic update
      const snapshotOrder = currentOrder.slice();
      let snapshotMilestones: TaskBoard.Milestone[] = [];

      // Optimistically update ordering and milestones
      setOrderingState(updatedOrder);
      setMilestonesState((prev) => {
        snapshotMilestones = prev.slice();
        return reorderMilestonesByIds(prev, updatedOrder);
      });

      try {
        const response = await Api.project_milestones.updateOrdering({
          projectId,
          orderingState: updatedOrder,
        });

        const serverOrdering = response.project?.milestonesOrderingState || updatedOrder;

        setMilestonesState((prev) => {
          const normalized = normalizeMilestoneOrdering(serverOrdering, prev);
          setOrderingState((prevOrdering) => (arraysEqual(prevOrdering, normalized) ? prevOrdering : normalized));
          return reorderMilestonesByIds(prev, normalized);
        });

        PageCache.invalidate(cacheKey);

        if (refresh) {
          await refresh();
        }
      } catch (error) {
        showErrorToast("Error", "Failed to reorder milestones");
        setOrderingState(snapshotOrder);
        setMilestonesState(snapshotMilestones);
      }
    },
    [cacheKey, projectId, refresh],
  );

  return {
    milestones,
    setMilestones,
    orderingState,
    reorderMilestones,
  };
}

// Builds a deduped sequence that preserves known ids, discards stale ones, 
// and appends unseen milestones at the end so data is never dropped.
function normalizeMilestoneOrdering(ordering: string[] | undefined, milestones: TaskBoard.Milestone[]): string[] {
  if (milestones.length === 0) {
    return [];
  }

  const milestoneIds = milestones.map((milestone) => milestone.id);
  const idSet = new Set(milestoneIds);
  const seen = new Set<string>();
  const normalized: string[] = [];

  (ordering || []).forEach((id) => {
    if (!idSet.has(id)) return;
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  milestoneIds.forEach((id) => {
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  return normalized;
}

// Converts the normalized ordering back into milestone objects, 
// skipping ids that are no longer present in the map.
function reorderMilestonesByIds(
  milestones: TaskBoard.Milestone[],
  ordering: string[],
): TaskBoard.Milestone[] {
  if (milestones.length === 0) {
    return [];
  }

  const map = new Map(milestones.map((milestone) => [milestone.id, milestone] as const));
  const normalized = normalizeMilestoneOrdering(ordering, milestones);

  return normalized
    .map((id) => map.get(id))
    .filter((milestone): milestone is TaskBoard.Milestone => Boolean(milestone));
}

// moveMilestoneId returns a new ordering with the requested id moved to a bounded destination index, or null when the source id cannot be found or removed.
function moveMilestoneId(order: string[], sourceId: string, destinationIndex: number): string[] | null {
  const currentIndex = order.indexOf(sourceId);
  if (currentIndex === -1) {
    return null;
  }

  const nextOrder = order.slice();
  const [removed] = nextOrder.splice(currentIndex, 1);
  if (!removed) {
    return null;
  }
  const boundedIndex = Math.min(Math.max(destinationIndex, 0), nextOrder.length);
  nextOrder.splice(boundedIndex, 0, removed);

  return nextOrder;
}

// arraysEqual performs an element-wise comparison so callers can avoid redundant ordering state updates when nothing actually changed.
function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const __testExports = {
  normalizeMilestoneOrdering,
  reorderMilestonesByIds,
  moveMilestoneId,
};
