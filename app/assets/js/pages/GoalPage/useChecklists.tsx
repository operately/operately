import * as Goals from "@/models/goals";
import * as React from "react";

import Api from "@/api";
import { Checklist, showErrorToast } from "turboui";

interface Checklists {
  items: Checklist.ChecklistItem[];
  add: Checklist.AddChecklistItemFn;
  delete: Checklist.DeleteChecklistItemFn;
  update: Checklist.UpdateChecklistItemFn;
  toggle: Checklist.ToggleChecklistItemFn;
  updateIndex: Checklist.UpdateChecklistItemIndexFn;
}

interface UseChecklistsParams {
  goalId: string;
  initialChecklist: Goals.Check[];
}

export function useChecklists(params: UseChecklistsParams): Checklists {
  const [items, setItems] = React.useState<Checklist.ChecklistItem[]>([]);

  React.useEffect(() => {
    const sorted = params.initialChecklist.sort((a, b) => a.index - b.index);
    setItems(sorted.map((check) => ({ ...check, mode: "view" as const })));
  }, [params.initialChecklist]);

  return {
    items: items,
    add: useAddHandler({ goalId: params.goalId, items, setItems }),
    delete: useDeleteHandler({ goalId: params.goalId, items, setItems }),
    update: useUpdateHandler({ items, setItems, params }),
    toggle: useToggleHandler({ items, setItems, params }),
    updateIndex: useUpdateIndexHandler({ items, setItems, params }),
  };
}

interface UseAddHandlerParams {
  goalId: string;
  items: Checklist.ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<Checklist.ChecklistItem[]>>;
}

function useAddHandler(params: UseAddHandlerParams): Checklist.AddChecklistItemFn {
  return React.useCallback(
    async function ({ name }: { name: string }): Promise<{ id: string; success: boolean }> {
      const tempId = newTempId();
      const item = {
        id: tempId,
        name,
        completed: false,
        index: params.items.length,
        mode: "view" as const,
      };

      params.setItems((prev) => [...prev, item]);

      Api.goals
        .addCheck({ goalId: params.goalId, name: name })
        .then((res) => {
          if (res.success) {
            params.setItems((prev) => prev.map((i) => (i.id === tempId ? { ...i, id: res.checkId } : i)));
          }
        })
        .catch((error) => {
          console.error("Failed to add checklist item:", error);
          showErrorToast("Something went wrong", "Failed to add checklist item");
          params.setItems((prev) => prev.filter((i) => i.id !== tempId));
        });

      return { id: tempId, success: true };
    },
    [params.goalId, params.items.length],
  );
}

interface UseDeleteHandlerParams {
  goalId: string;
  items: Checklist.ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<Checklist.ChecklistItem[]>>;
}

function useDeleteHandler(params: UseDeleteHandlerParams): Checklist.DeleteChecklistItemFn {
  return React.useCallback(
    async function (id: string): Promise<boolean> {
      let deletedItem: Checklist.ChecklistItem | undefined;
      params.setItems((prev) => {
        const filtered = prev.filter((item) => {
          if (item.id === id) deletedItem = item;
          return item.id !== id;
        });
        return filtered;
      });

      try {
        await Api.goals.deleteCheck({ goalId: params.goalId, checkId: id });
      } catch (error) {
        console.error("Failed to delete checklist item:", error);
        showErrorToast("Something went wrong", "Failed to delete checklist item");
        // Revert deletion if API call fails
        if (deletedItem) {
          params.setItems((prev) => {
            // Insert back at the original index
            const newItems = [...prev];
            newItems.splice(deletedItem!.index, 0, deletedItem!);
            return newItems.map((item, i) => ({ ...item, index: i }));
          });
        }
        return false;
      }

      return true;
    },
    [params.goalId, params.setItems],
  );
}

interface UseToggleHandlerParams {
  items: Checklist.ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<Checklist.ChecklistItem[]>>;
  params: UseChecklistsParams;
}

function useUpdateHandler(params: UseToggleHandlerParams): Checklist.UpdateChecklistItemFn {
  return React.useCallback(
    async function (inputs: { itemId: string; name: string }): Promise<boolean> {
      let previousName: string | undefined;

      params.setItems((prev) =>
        prev.map((item) => {
          if (item.id === inputs.itemId) {
            previousName = item.name;
            return { ...item, name: inputs.name };
          }
          return item;
        }),
      );

      try {
        await Api.goals.updateCheck({
          goalId: params.params.goalId,
          checkId: inputs.itemId,
          name: inputs.name,
        });
      } catch (error) {
        console.error("Failed to update checklist item:", error);
        showErrorToast("Something went wrong", "Failed to update checklist item");
        // Revert the change
        if (previousName !== undefined) {
          params.setItems((prev) =>
            prev.map((item) => (item.id === inputs.itemId ? { ...item, name: previousName! } : item)),
          );
        }
        return false;
      }

      return true;
    },
    [params.setItems, params.params.goalId],
  );
}

interface UseToggleHandlerParams {
  items: Checklist.ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<Checklist.ChecklistItem[]>>;
  params: UseChecklistsParams;
}

function useUpdateIndexHandler(params: UseToggleHandlerParams): Checklist.UpdateChecklistItemIndexFn {
  return React.useCallback(
    async function (id: string, index: number): Promise<boolean> {
      let previousIndex: number | undefined;

      params.setItems((prev) => {
        const item = prev.find((item) => item.id === id);
        if (!item) return prev;

        previousIndex = item.index;

        const newItems = prev.filter((item) => item.id !== id);
        item.index = index;
        newItems.splice(index, 0, item);

        return newItems.map((item, i) => ({ ...item, index: i }));
      });

      try {
        await Api.goals.updateCheckIndex({ goalId: params.params.goalId, checkId: id, index });
      } catch (error) {
        console.error("Failed to update checklist item index:", error);
        showErrorToast("Something went wrong", "Failed to update checklist item index");
        // Revert the change
        if (previousIndex !== undefined) {
          params.setItems((prev) => {
            const item = prev.find((item) => item.id === id);
            if (!item) return prev;

            const newItems = prev.filter((item) => item.id !== id);
            item.index = previousIndex!;
            newItems.splice(previousIndex!, 0, item);

            return newItems.map((item, i) => ({ ...item, index: i }));
          });
        }
        return false;
      }

      return true;
    },
    [params.setItems, params.params.goalId],
  );
}

interface UseToggleHandlerParams {
  items: Checklist.ChecklistItem[];
  setItems: React.Dispatch<React.SetStateAction<Checklist.ChecklistItem[]>>;
  params: UseChecklistsParams;
}

function useToggleHandler(params: UseToggleHandlerParams): Checklist.ToggleChecklistItemFn {
  return React.useCallback(
    async function (id: string): Promise<boolean> {
      let previousCompleted: boolean | undefined;

      params.setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            previousCompleted = item.completed;
            return { ...item, completed: !item.completed };
          }
          return item;
        }),
      );

      try {
        await Api.goals.toggleCheck({ goalId: params.params.goalId, checkId: id });
      } catch (error) {
        console.error("Failed to toggle checklist item:", error);
        showErrorToast("Something went wrong", "Failed to toggle checklist item");
        // Revert the change
        if (previousCompleted !== undefined) {
          params.setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, completed: previousCompleted! } : item)),
          );
        }
        return false;
      }

      return true;
    },
    [params.setItems, params.params.goalId],
  );
}

function newTempId(): string {
  return `temp-${Math.random().toString(36).substring(2, 9)}`;
}
