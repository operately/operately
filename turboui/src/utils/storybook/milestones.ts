import * as React from "react";
import * as TaskBoardTypes from "../../TaskBoard/types";

interface UseMockMilestoneOrderingOptions {
  initialMilestones: TaskBoardTypes.Milestone[];
  initialOrderingState?: string[];
}

interface UseMockMilestoneOrderingResult {
  milestones: TaskBoardTypes.Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<TaskBoardTypes.Milestone[]>>;
  orderingState: string[];
  reorderMilestones: (sourceId: string, destinationIndex: number) => Promise<void>;
}

/**
 * Mock version of useProjectMilestoneOrdering for Storybook.
 * Performs optimistic updates without backend API calls.
 * Based on app/assets/js/models/projects/useProjectMilestoneOrdering.ts
 */
export function useMockMilestoneOrdering({
  initialMilestones,
  initialOrderingState,
}: UseMockMilestoneOrderingOptions): UseMockMilestoneOrderingResult {
  const initialDataRef = React.useRef<{ milestones: TaskBoardTypes.Milestone[]; ordering: string[] } | null>(null);

  if (!initialDataRef.current) {
    const ordering = normalizeMilestoneOrdering(initialOrderingState, initialMilestones);
    initialDataRef.current = {
      milestones: reorderMilestonesByIds(initialMilestones, ordering),
      ordering,
    };
  }

  const [milestones, setMilestonesState] = React.useState<TaskBoardTypes.Milestone[]>(initialDataRef.current.milestones);
  const [orderingState, setOrderingState] = React.useState<string[]>(initialDataRef.current.ordering);

  const orderingRef = React.useRef(orderingState);

  React.useEffect(() => {
    orderingRef.current = orderingState;
  }, [orderingState]);

  const setMilestones = React.useCallback<React.Dispatch<React.SetStateAction<TaskBoardTypes.Milestone[]>>>(
    (update) => {
      setMilestonesState((prev) => {
        const next =
          typeof update === "function"
            ? (update as (value: TaskBoardTypes.Milestone[]) => TaskBoardTypes.Milestone[])(prev)
            : update;
        const normalized = normalizeMilestoneOrdering(orderingRef.current, next);

        setOrderingState((prevOrdering) => (arraysEqual(prevOrdering, normalized) ? prevOrdering : normalized));

        return reorderMilestonesByIds(next, normalized);
      });
    },
    [],
  );

  const reorderMilestones = React.useCallback(async (sourceId: string, destinationIndex: number) => {
    const currentOrder = orderingRef.current;
    const updatedOrder = moveMilestoneId(currentOrder, sourceId, destinationIndex);

    if (!updatedOrder) {
      return;
    }

    // Optimistically update ordering and milestones (no API call, no rollback)
    setOrderingState(updatedOrder);
    setMilestonesState((prev) => {
      return reorderMilestonesByIds(prev, updatedOrder);
    });
  }, []);

  return {
    milestones,
    setMilestones,
    orderingState,
    reorderMilestones,
  };
}

/**
 * Builds a deduped sequence that preserves known ids, discards stale ones,
 * and appends unseen milestones at the end so data is never dropped.
 */
function normalizeMilestoneOrdering(
  ordering: string[] | undefined,
  milestones: TaskBoardTypes.Milestone[],
): string[] {
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

/**
 * Converts the normalized ordering back into milestone objects,
 * skipping ids that are no longer present in the map.
 */
function reorderMilestonesByIds(
  milestones: TaskBoardTypes.Milestone[],
  ordering: string[],
): TaskBoardTypes.Milestone[] {
  if (milestones.length === 0) {
    return [];
  }

  const map = new Map(milestones.map((milestone) => [milestone.id, milestone] as const));
  const normalized = normalizeMilestoneOrdering(ordering, milestones);

  return normalized
    .map((id) => map.get(id))
    .filter((milestone): milestone is TaskBoardTypes.Milestone => Boolean(milestone));
}

/**
 * Returns a new ordering with the requested id moved to a bounded destination index,
 * or null when the source id cannot be found or removed.
 */
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

/**
 * Performs an element-wise comparison so callers can avoid redundant
 * ordering state updates when nothing actually changed.
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
