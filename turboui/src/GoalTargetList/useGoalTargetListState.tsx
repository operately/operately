import { GoalTargetList } from ".";
import { useListState } from "../utils/useListState";

export type TargetState = GoalTargetList.Target & {
  expanded: boolean;
  editButtonVisible: boolean;
  updateButtonVisible: boolean;
};

export interface State {
  addActive: boolean;
  targets: TargetState[];

  toggleExpand: (id: string) => void;

  cancelAdd: () => void;
  addTarget: (newTarget: { name: string; from: number; to: number; unit: string }) => void;

  startUpdating: (id: string) => void;
  cancelUpdate: (id: string) => void;
  updateTarget: (id: string, newValue: number) => void;

  startEditing: (id: string) => void;
  cancelEdit: (id: string) => void;
  saveEdit: (id: string, newTarget: Partial<GoalTargetList.Target>) => void;

  startDeleting: (id: string) => void;
  deleteTarget: (id: string) => void;
  cancelDelete: (id: string) => void;

  reorder: (item: any, targetId: string, indexInDropZone: number) => void;
}

export function useGoalTargetListState(props: GoalTargetList.Props): State {
  const [targets, { update, remove, reorder, append }] = useListState<TargetState>(() => {
    return props.targets.map((t) => ({
      ...t,
      editButtonVisible: !!props.showEditButton,
      updateButtonVisible: !!props.showUpdateButton,
      expanded: false,
    }));
  });

  const state: State = {
    targets,
    addActive: !!props.addActive,

    addTarget: (values) => {
      const target: TargetState = {
        ...values,
        value: values.from,
        id: crypto.randomUUID() as string,
        index: targets.length,
        mode: "view",
        expanded: false,
        editButtonVisible: !!props.showEditButton,
        updateButtonVisible: !!props.showUpdateButton,
      };

      props.onAddActiveChange?.(false);
      append(target);
    },

    toggleExpand: (id: string) => {
      update(id, (t) => ({ ...t, expanded: !t.expanded }));
    },

    // Adding
    cancelAdd: () => {
      props.onAddActiveChange?.(false);
    },

    // Updating
    startUpdating: (id: string) => {
      update(id, (t) => ({ ...t, mode: "update" as const }));
    },
    cancelUpdate: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },
    updateTarget: (id: string, newValue: number) => {
      update(id, (t) => ({ ...t, value: newValue, mode: "view" as const }));
    },

    // Editing
    startEditing: (id: string) => {
      update(id, (t) => ({ ...t, mode: "edit" as const }));
    },
    cancelEdit: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },
    saveEdit: (id: string, newTarget: Partial<GoalTargetList.Target>) => {
      update(id, (t) => ({ ...t, ...newTarget, mode: "view" as const }));
    },

    // Deleting
    startDeleting: (id: string) => {
      update(id, (t) => ({ ...t, mode: "delete" as const }));
    },
    deleteTarget: (id: string) => {
      remove(id);
    },
    cancelDelete: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },

    // Drag and drop
    reorder: (_: any, id: string, newIndex: number) => {
      reorder(id, newIndex);
    },
  };

  return state;
}
