import * as Companies from "@/models/companies";
import * as React from "react";

import { Checklist } from "turboui";

interface Checklists {
  enabled: boolean;

  items: Checklist.ChecklistItem[];
  add: Checklist.AddChecklistItemFn;
  delete: Checklist.DeleteChecklistItemFn;
  update: Checklist.UpdateChecklistItemFn;
  toggle: Checklist.ToggleChecklistItemFn;
  updateIndex: Checklist.UpdateChecklistItemIndexFn;
}

interface UseChecklistsParams {
  company: Companies.Company;
}

export function useChecklists(params: UseChecklistsParams): Checklists {
  const [items, setItems] = React.useState<Checklist.ChecklistItem[]>([]);

  return {
    enabled: Companies.hasFeature(params.company, "checklists"),
    items: items,

    add: async function ({ name }: { name: string }): Promise<{ id: string; success: boolean }> {
      const tempId = newTempId();
      const item = {
        id: tempId,
        name,
        completed: false,
        index: items.length,
        mode: "view" as const,
      };

      setItems((prev) => [...prev, item]);
      return { id: tempId, success: true };
    },

    delete: async function (id: string): Promise<boolean> {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    },

    update: async function (inputs: { itemId: string; name: string }): Promise<boolean> {
      setItems((prev) => prev.map((item) => (item.id === inputs.itemId ? { ...item, name: inputs.name } : item)));

      return true;
    },

    toggle: async function (id: string, completed: boolean): Promise<boolean> {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed, mode: "view" as const } : item)));

      return true;
    },

    updateIndex: async function (id: string, index: number): Promise<boolean> {
      setItems((prev) => {
        const item = prev.find((item) => item.id === id);
        if (!item) return prev;

        const newItems = prev.filter((item) => item.id !== id);
        item.index = index;
        newItems.splice(index, 0, item);

        return newItems.map((item, i) => ({ ...item, index: i }));
      });

      return true;
    },
  };
}

function newTempId(): string {
  return `temp-${Math.random().toString(36).substr(2, 9)}`;
}
