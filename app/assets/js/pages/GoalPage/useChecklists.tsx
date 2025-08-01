import * as Companies from "@/models/companies";
import { Checklist } from "turboui";

export interface Checklists {
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
  return {
    enabled: Companies.hasFeature(params.company, "checklists"),
    items: [],

    add: async function (_inputs): Promise<{ id: string; success: boolean }> {
      console.error("Checklist feature not implemented yet");
      return { id: "", success: false };
    },

    delete: async function (_id: string): Promise<boolean> {
      console.error("Checklist feature not implemented yet");
      return false;
    },

    update: async function (_inputs): Promise<boolean> {
      console.error("Checklist feature not implemented yet");
      return false;
    },

    toggle: async function (_id: string, _completed: boolean): Promise<boolean> {
      console.error("Checklist feature not implemented yet");
      return false;
    },

    updateIndex: async function (_id: string, _index: number): Promise<boolean> {
      console.error("Checklist feature not implemented yet");
      return false;
    },
  };
}
