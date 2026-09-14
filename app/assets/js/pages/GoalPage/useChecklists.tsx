import { useMemo } from "react";
import * as Goals from "@/models/goals";
import { useOptimisticGoalState } from "@/models/goals/useOptimisticGoalState";
import { Checklist, showErrorToast } from "turboui";

type Item = Checklist.ChecklistItem;
interface Checklists {
  items: Item[];
  add: Checklist.AddChecklistItemFn;
  delete: Checklist.DeleteChecklistItemFn;
  update: Checklist.UpdateChecklistItemFn;
  toggle: Checklist.ToggleChecklistItemFn;
  updateIndex: Checklist.UpdateChecklistItemIndexFn;
}

export function useChecklists({
  goalId,
  initialChecklist,
}: {
  goalId: string;
  initialChecklist: Goals.Check[];
}): Checklists {
  const serverItems = useMemo(
    () =>
      normalize(
        initialChecklist
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((item) => ({ ...item, mode: "view" as const })),
      ),
    [initialChecklist],
  );
  const { value: items, run } = useOptimisticGoalState(goalId, serverItems);
  const createdIds = useMemo(() => new Map<string, string | null>(), [goalId]);
  const resolveId = (id: string) => createdIds.get(id) ?? id;
  const create = Goals.useCreateGoalCheck();
  const remove = Goals.useDeleteGoalCheck();
  const update = Goals.useUpdateGoalCheck();
  const toggle = Goals.useToggleGoalCheck();
  const reorder = Goals.useUpdateGoalCheckIndex();

  const add: Checklists["add"] = async ({ name }) => {
    const temporary = {
      id: `temp-${crypto.randomUUID()}`,
      name,
      completed: false,
      index: items.length,
      mode: "view" as const,
    };
    createdIds.set(temporary.id, null);
    try {
      const id = await run(
        (items) => normalize([...items, temporary]),
        async () => {
          const result = await create.mutateAsync({ goalId, name });
          if (!result.checkId) throw new Error("Missing checklist item id from server response");
          createdIds.set(temporary.id, result.checkId);
          return result.checkId;
        },
        (items, id) => normalize([...items, { ...temporary, id }]),
      );
      return { id, success: true };
    } catch (error) {
      console.error("Failed to add checklist item:", error);
      showErrorToast("Something went wrong", "Failed to add checklist item");
      return { id: "", success: false };
    }
  };

  const save = async (
    id: string,
    change: (items: Item[]) => Item[],
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
      showErrorToast("Something went wrong", message);
      return false;
    }
  };

  return {
    items,
    add,
    delete: (id) =>
      save(
        id,
        (items) => normalize(items.filter((item) => item.id !== resolveId(id))),
        () => remove.mutateAsync({ goalId, checkId: resolveId(id) }),
        "Failed to delete checklist item",
      ),
    update: ({ itemId, name }) =>
      save(
        itemId,
        (items) => items.map((item) => (item.id === resolveId(itemId) ? { ...item, name } : item)),
        () => update.mutateAsync({ goalId, checkId: resolveId(itemId), name }),
        "Failed to update checklist item",
      ),
    toggle: (id) =>
      save(
        id,
        (items) => items.map((item) => (item.id === resolveId(id) ? { ...item, completed: !item.completed } : item)),
        () => toggle.mutateAsync({ goalId, checkId: resolveId(id) }),
        "Failed to toggle checklist item",
      ),
    updateIndex: (id, index) =>
      save(
        id,
        (items) => {
          const item = items.find((item) => item.id === resolveId(id));
          if (!item) return items;
          const reordered = items.filter((item) => item.id !== resolveId(id));
          reordered.splice(index, 0, item);
          return normalize(reordered);
        },
        () => reorder.mutateAsync({ goalId, checkId: resolveId(id), index }),
        "Failed to update checklist item index",
      ),
  };
}

function normalize(items: Item[]): Item[] {
  return items.map((item, index) => ({ ...item, index }));
}
