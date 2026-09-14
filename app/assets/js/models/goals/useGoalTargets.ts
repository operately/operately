import { useMemo } from "react";
import { showErrorToast } from "turboui";
import {
  useCreateGoalTarget,
  useDeleteGoalTarget,
  useUpdateGoalTarget,
  useUpdateGoalTargetValue,
  useUpdateGoalTargetIndex,
} from "./goalItemLifecycle";
import { useOptimisticGoalState } from "./useOptimisticGoalState";

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
type TargetInputs = { name: string; startValue: number; targetValue: number; unit: string };

export function useGoalTargets({ goalId, initialTargets }: { goalId: string; initialTargets: GoalTarget[] }) {
  const serverTargets = useMemo(
    () => normalize(initialTargets.slice().sort((a, b) => a.index - b.index)),
    [initialTargets],
  );
  const { value: targets, run } = useOptimisticGoalState(goalId, serverTargets);
  const createdIds = useMemo(() => new Map<string, string | null>(), [goalId]);
  const resolveId = (id: string) => createdIds.get(id) ?? id;
  const create = useCreateGoalTarget();
  const remove = useDeleteGoalTarget();
  const update = useUpdateGoalTarget();
  const updateValue = useUpdateGoalTargetValue();
  const updateIndex = useUpdateGoalTargetIndex();

  const addTarget = async (inputs: TargetInputs): Promise<{ success: boolean; id: string }> => {
    const temporary = {
      id: crypto.randomUUID(),
      name: inputs.name,
      from: inputs.startValue,
      to: inputs.targetValue,
      value: inputs.startValue,
      unit: inputs.unit,
      index: targets.length,
      mode: "view" as const,
    };
    createdIds.set(temporary.id, null);
    try {
      const id = await run(
        (items) => normalize([...items, temporary]),
        async () => {
          const result = await create.mutateAsync({ goalId, ...inputs });
          if (!result.targetId) throw new Error("Missing target id from server response");
          createdIds.set(temporary.id, result.targetId);
          return result.targetId;
        },
        (items, id) => normalize([...items, { ...temporary, id }]),
      );
      return { success: true, id };
    } catch (error) {
      console.error("Failed to add target", error);
      showErrorToast("Error", "Failed to add target");
      return { success: false, id: "" };
    }
  };

  const save = async (
    id: string,
    change: (items: GoalTarget[]) => GoalTarget[],
    request: () => Promise<unknown>,
    message: string,
  ) => {
    try {
      return await run(
        change,
        async () => {
          // Creation runs first; an unresolved temporary ID means it failed.
          if (createdIds.get(id) === null) return false;
          await request();
          return true;
        },
        (items, saved) => (saved ? change(items) : items),
      );
    } catch (error) {
      console.error(message, error);
      showErrorToast("Error", message);
      return false;
    }
  };

  const deleteTarget = (id: string) =>
    save(
      id,
      (items) => normalize(items.filter((item) => item.id !== resolveId(id))),
      () => remove.mutateAsync({ goalId, targetId: resolveId(id) }),
      "Failed to delete target",
    );

  const updateTarget = (inputs: TargetInputs & { targetId: string }) =>
    save(
      inputs.targetId,
      (items) =>
        items.map((item) =>
          item.id === resolveId(inputs.targetId)
            ? {
                ...item,
                name: inputs.name,
                from: inputs.startValue,
                to: inputs.targetValue,
                unit: inputs.unit,
              }
            : item,
        ),
      () => update.mutateAsync({ goalId, ...inputs, targetId: resolveId(inputs.targetId) }),
      "Failed to update target",
    );

  const updateTargetValue = (id: string, value: number) =>
    save(
      id,
      (items) => items.map((item) => (item.id === resolveId(id) ? { ...item, value, mode: "view" } : item)),
      () => updateValue.mutateAsync({ goalId, targetId: resolveId(id), value }),
      "Failed to update target value",
    );

  const updateTargetIndex = (id: string, index: number) => {
    if (!targets.some((item) => item.id === resolveId(id))) return Promise.resolve(false);
    const destination = Math.min(Math.max(index, 0), targets.length - 1);

    return save(
      id,
      (items) => {
        const item = items.find((item) => item.id === resolveId(id));
        if (!item) return items;
        const reordered = items.filter((item) => item.id !== resolveId(id));
        reordered.splice(destination, 0, item);
        return normalize(reordered);
      },
      () => updateIndex.mutateAsync({ goalId, targetId: resolveId(id), index: destination }),
      "Failed to reorder targets",
    );
  };

  return { targets, addTarget, deleteTarget, updateTarget, updateTargetValue, updateTargetIndex };
}

function normalize(items: GoalTarget[]): GoalTarget[] {
  return items.map((item, index) => ({ ...item, index }));
}
