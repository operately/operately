import * as React from "react";

import Api from "@/api";
import { PageCache } from "@/routes/PageCache";
import { showErrorToast } from "turboui";

type GoalTarget = {
  id: string;
  name: string;
  from: number;
  to: number;
  value: number;
  unit: string;
  index: number;
  mode: "view" | "update" | "edit" | "delete";
};

interface UseGoalTargetsOptions {
  goalId: string;
  cacheKey: string;
  initialTargets: GoalTarget[];
  refresh?: () => Promise<void>;
}

interface GoalTargetUpdateInputs {
  targetId: string;
  name: string;
  startValue: number;
  targetValue: number;
  unit: string;
}

interface GoalTargetCreateInputs {
  name: string;
  startValue: number;
  targetValue: number;
  unit: string;
}

interface UseGoalTargetsResult {
  targets: GoalTarget[];
  setTargets: React.Dispatch<React.SetStateAction<GoalTarget[]>>;
  addTarget: (inputs: GoalTargetCreateInputs) => Promise<{ success: boolean; id: string }>;
  deleteTarget: (id: string) => Promise<boolean>;
  updateTarget: (inputs: GoalTargetUpdateInputs) => Promise<boolean>;
  updateTargetValue: (id: string, value: number) => Promise<boolean>;
  updateTargetIndex: (id: string, destinationIndex: number) => Promise<boolean>;
}

export function useGoalTargets({
  goalId,
  cacheKey,
  refresh,
  initialTargets,
}: UseGoalTargetsOptions): UseGoalTargetsResult {
  const initialDataRef = React.useRef<{ targets: GoalTarget[]; ordering: string[] } | null>(null);

  if (!initialDataRef.current) {
    const orderedTargets = sortTargets(initialTargets);
    const ordering = orderedTargets.map((target) => target.id);
    initialDataRef.current = {
      targets: orderedTargets,
      ordering,
    };
  }

  const [targets, setTargetsState] = React.useState<GoalTarget[]>(initialDataRef.current.targets);
  const [orderingState, setOrderingState] = React.useState<string[]>(initialDataRef.current.ordering);

  const orderingRef = React.useRef(orderingState);
  const targetsRef = React.useRef(targets);

  React.useEffect(() => {
    orderingRef.current = orderingState;
  }, [orderingState]);

  React.useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Keeps the refs, state, and ordering in sync 
  // so optimistic updates stay consistent across async callbacks.
  const applyTargetsState = React.useCallback(
    (nextTargets: GoalTarget[], nextOrdering: string[]) => {
      targetsRef.current = nextTargets;
      orderingRef.current = nextOrdering;
      setTargetsState(nextTargets);
      setOrderingState(nextOrdering);
    },
    [setTargetsState, setOrderingState],
  );

  // Mirrors React's setState signature but always normalizes the ordering before committing changes.
  const setTargets = React.useCallback<React.Dispatch<React.SetStateAction<GoalTarget[]>>>(
    (update) => {
      setTargetsState((prev) => {
        const next = typeof update === "function" ? (update as (value: GoalTarget[]) => GoalTarget[])(prev) : update;
        const normalized = normalizeTargetOrdering(orderingRef.current, next);

        const reordered = reorderTargetsByIds(next, normalized);

        targetsRef.current = reordered;
        orderingRef.current = normalized;

        setOrderingState((prevOrdering) => {
          if (arraysEqual(prevOrdering, normalized)) {
            return prevOrdering;
          }

          return normalized;
        });

        return reordered;
      });
    },
    [setTargetsState, setOrderingState],
  );

  const addTarget = React.useCallback(
    async (inputs: GoalTargetCreateInputs): Promise<{ success: boolean; id: string }> => {
      const tempId = crypto.randomUUID();
      const snapshotTargets = cloneTargets(targetsRef.current);
      const snapshotOrdering = orderingRef.current.slice();

      const optimisticTarget: GoalTarget = {
        id: tempId,
        name: inputs.name,
        from: inputs.startValue,
        to: inputs.targetValue,
        value: inputs.startValue,
        unit: inputs.unit,
        index: orderingRef.current.length,
        mode: "view",
      };

      const optimisticOrdering = [...orderingRef.current, tempId];

      const optimisticTargetsList = reorderTargetsByIds([...snapshotTargets, optimisticTarget], optimisticOrdering);

      applyTargetsState(optimisticTargetsList, optimisticOrdering);

      try {
        const response = await Api.goals.addTarget({
          goalId,
          name: inputs.name,
          startValue: inputs.startValue,
          targetValue: inputs.targetValue,
          unit: inputs.unit,
        });

        const targetId = response.targetId;
        if (!targetId) {
          throw new Error("Missing target id from server response");
        }

        const updatedOrdering = optimisticOrdering.map((id) => (id === tempId ? targetId : id));
        const updatedTargetsList = reorderTargetsByIds(
          optimisticTargetsList.map((target) => (target.id === tempId ? { ...target, id: targetId } : target)),
          updatedOrdering,
        );

        applyTargetsState(updatedTargetsList, updatedOrdering);

        PageCache.invalidate(cacheKey);
        if (refresh) {
          await refresh();
        }

        return { success: true, id: targetId };
      } catch (error) {
        console.error("Failed to add target", error);
        applyTargetsState(snapshotTargets, snapshotOrdering);
        showErrorToast("Error", "Failed to add target");

        return { success: false, id: "" };
      }
    },
    [goalId, cacheKey, refresh, applyTargetsState],
  );

  const deleteTarget = React.useCallback(
    async (id: string): Promise<boolean> => {
      const snapshotTargets = cloneTargets(targetsRef.current);
      const snapshotOrdering = orderingRef.current.slice();

      const optimisticTargets = snapshotTargets.filter((target) => target.id !== id);
      const optimisticOrdering = snapshotOrdering.filter((targetId) => targetId !== id);
      const optimisticTargetsList = reorderTargetsByIds(optimisticTargets, optimisticOrdering);

      applyTargetsState(optimisticTargetsList, optimisticOrdering);

      try {
        await Api.goals.deleteTarget({ goalId, targetId: id });

        PageCache.invalidate(cacheKey);
        if (refresh) {
          await refresh();
        }

        return true;
      } catch (error) {
        console.error("Failed to delete target", error);
        applyTargetsState(snapshotTargets, snapshotOrdering);
        showErrorToast("Error", "Failed to delete target");

        return false;
      }
    },
    [goalId, cacheKey, refresh, applyTargetsState],
  );

  const updateTarget = React.useCallback(
    async (inputs: GoalTargetUpdateInputs): Promise<boolean> => {
      const snapshotTargets = cloneTargets(targetsRef.current);
      const snapshotOrdering = orderingRef.current.slice();

      const optimisticTargetsList = snapshotTargets.map((target) =>
        target.id === inputs.targetId
          ? {
              ...target,
              name: inputs.name,
              from: inputs.startValue,
              to: inputs.targetValue,
              unit: inputs.unit,
            }
          : target,
      );

      applyTargetsState(optimisticTargetsList, snapshotOrdering);

      try {
        await Api.goals.updateTarget({
          goalId,
          targetId: inputs.targetId,
          name: inputs.name,
          startValue: inputs.startValue,
          targetValue: inputs.targetValue,
          unit: inputs.unit,
        });

        PageCache.invalidate(cacheKey);
        if (refresh) {
          await refresh();
        }

        return true;
      } catch (error) {
        console.error("Failed to update target", error);
        applyTargetsState(snapshotTargets, snapshotOrdering);
        showErrorToast("Error", "Failed to update target");

        return false;
      }
    },
    [goalId, cacheKey, refresh, applyTargetsState],
  );

  const updateTargetValue = React.useCallback(
    async (id: string, value: number): Promise<boolean> => {
      const snapshotTargets = cloneTargets(targetsRef.current);
      const snapshotOrdering = orderingRef.current.slice();

      const optimisticTargetsList = snapshotTargets.map((target) =>
        target.id === id ? { ...target, value, mode: "view" as const } : target,
      );

      applyTargetsState(optimisticTargetsList, snapshotOrdering);

      try {
        await Api.goals.updateTargetValue({
          goalId,
          targetId: id,
          value,
        });

        PageCache.invalidate(cacheKey);
        if (refresh) {
          await refresh();
        }

        return true;
      } catch (error) {
        console.error("Failed to update target value", error);
        applyTargetsState(snapshotTargets, snapshotOrdering);
        showErrorToast("Error", "Failed to update target value");

        return false;
      }
    },
    [goalId, cacheKey, refresh, applyTargetsState],
  );

  const updateTargetIndex = React.useCallback(
    async (id: string, destinationIndex: number): Promise<boolean> => {
      const currentOrdering = orderingRef.current;
      const updatedOrdering = moveTargetId(currentOrdering, id, destinationIndex);

      if (!updatedOrdering) {
        return false;
      }

      const snapshotTargets = cloneTargets(targetsRef.current);
      const snapshotOrdering = currentOrdering.slice();
      const optimisticTargetsList = reorderTargetsByIds(snapshotTargets, updatedOrdering);

      applyTargetsState(optimisticTargetsList, updatedOrdering);

      try {
        await Api.goals.updateTargetIndex({
          goalId,
          targetId: id,
          index: destinationIndex,
        });

        PageCache.invalidate(cacheKey);
        if (refresh) {
          await refresh();
        }

        return true;
      } catch (error) {
        console.error("Failed to update target index", error);
        applyTargetsState(snapshotTargets, snapshotOrdering);
        showErrorToast("Error", "Failed to reorder targets");

        return false;
      }
    },
    [goalId, cacheKey, refresh, applyTargetsState],
  );

  return {
    targets,
    setTargets,
    addTarget,
    deleteTarget,
    updateTarget,
    updateTargetValue,
    updateTargetIndex,
  };
}

function sortTargets(targets: GoalTarget[]): GoalTarget[] {
  return targets
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((target, index) => ({ ...target, index }));
}

function normalizeTargetOrdering(ordering: string[] | undefined, targets: GoalTarget[]): string[] {
  if (targets.length === 0) {
    return [];
  }

  const targetIds = targets.map((target) => target.id);
  const idSet = new Set(targetIds);
  const seen = new Set<string>();
  const normalized: string[] = [];

  (ordering || []).forEach((id) => {
    if (!idSet.has(id)) return;
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  targetIds.forEach((id) => {
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  return normalized;
}

function reorderTargetsByIds(targets: GoalTarget[], ordering: string[]): GoalTarget[] {
  if (targets.length === 0) {
    return [];
  }

  const map = new Map(targets.map((target) => [target.id, target] as const));
  const normalized = normalizeTargetOrdering(ordering, targets);

  return normalized
    .map((id, index) => {
      const target = map.get(id);
      if (!target) return null;

      return { ...target, index };
    })
    .filter((target): target is GoalTarget => Boolean(target));
}

function moveTargetId(order: string[], sourceId: string, destinationIndex: number): string[] | null {
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

function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function cloneTargets(targets: GoalTarget[]): GoalTarget[] {
  return targets.map((target) => ({ ...target }));
}
