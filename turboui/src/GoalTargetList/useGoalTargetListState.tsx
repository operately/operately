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
  saveEdit: (id: string, values: { name: string; from: number; to: number; unit: string }) => void;

  startDeleting: (id: string) => void;
  deleteTarget: (id: string) => void;
  cancelDelete: (id: string) => void;

  reorder: (item: any, targetId: string, indexInDropZone: number) => boolean;
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

      append(target);

      props
        .addTarget({
          name: target.name,
          startValue: target.from,
          targetValue: target.to,
          unit: target.unit,
        })
        .then((res) => {
          if (!res.success) {
            remove(target.id);
          } else {
            update(target.id, (t) => ({ ...t, id: res.id }));
          }
        });
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
      const oldValue = targets.find((t) => t.id === id)?.value;
      update(id, (t) => ({ ...t, value: newValue, mode: "view" as const }));

      props.updateTargetValue(id, newValue).then((success) => {
        if (!success) {
          // If the update failed, revert the value
          update(id, (t) => ({ ...t, value: oldValue! }));
        }
      });
    },

    // Editing
    startEditing: (id: string) => {
      update(id, (t) => ({ ...t, mode: "edit" as const }));
    },
    cancelEdit: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },
    saveEdit: (id: string, values: { name: string; from: number; to: number; unit: string }) => {
      update(id, (t) => ({ ...t, ...values, mode: "view" as const }));

      props
        .updateTarget({
          targetId: id,
          name: values.name,
          startValue: values.from,
          targetValue: values.to,
          unit: values.unit,
        })
        .catch((e) => {
          console.error("Failed to update target", e);

          // Revert the changes if the update fails
          update(id, (t) => ({ ...t, mode: "view" as const }));
        });
    },

    // Deleting
    startDeleting: (id: string) => {
      update(id, (t) => ({ ...t, mode: "delete" as const }));
    },
    deleteTarget: (id: string) => {
      const target = remove(id);

      props.deleteTarget(id).then((success) => {
        if (!success) {
          append(target!);
        }
      });
    },
    cancelDelete: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },

    // Drag and drop
    reorder: (_: any, id: string, newIndex: number) => {
      const oldIndex = targets.find((t) => t.id === id)?.index;
      if (oldIndex === undefined || oldIndex === null || oldIndex === newIndex) {
        return false; // No change needed
      }

      reorder(id, newIndex);

      props.updateTargetIndex(id, newIndex).then((success) => {
        if (!success) {
          reorder(id, oldIndex); // Revert if the update fails
        }
      });

      return true; // Successfully initiated reorder
    },
  };

  return state;
}
