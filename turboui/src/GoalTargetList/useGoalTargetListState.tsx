import { GoalTargetList } from ".";
import { useListState } from "../utils/useListState";

export type TargetState = GoalTargetList.Target & {
  expanded: boolean;
  editButtonVisible: boolean;
};

export interface State {
  targets: TargetState[];

  toggleExpand: (id: string) => void;

  startEditing: (id: string) => void;
  cancelEdit: (id: string) => void;
  saveEdit: (id: string, newTarget: Partial<GoalTargetList.Target>) => void;

  startDeleting: (id: string) => void;
  deleteTarget: (id: string) => void;
  cancelDelete: (id: string) => void;

  reorder: (item: any, targetId: string, indexInDropZone: number) => void;
}

export function useGoalTargetListState(props: GoalTargetList.Props): State {
  const [targets, { update, remove, reorder }] = useListState<TargetState>(() => {
    return props.targets.map((t) => ({
      ...t,
      editButtonVisible: !!props.showEditButton,
      expanded: false,
    }));
  });

  const state: State = {
    targets,

    toggleExpand: (id: string) => {
      update(id, (t) => ({ ...t, expanded: !t.expanded }));
    },

    startEditing: (id: string) => {
      update(id, (t) => ({ ...t, mode: "edit" as const }));
    },

    cancelEdit: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },

    saveEdit: (id: string, newTarget: Partial<GoalTargetList.Target>) => {
      update(id, (t) => ({ ...t, ...newTarget, mode: "view" as const }));
    },

    startDeleting: (id: string) => {
      update(id, (t) => ({ ...t, mode: "delete" as const }));
    },

    deleteTarget: (id: string) => {
      remove(id);
    },

    cancelDelete: (id: string) => {
      update(id, (t) => ({ ...t, mode: "view" as const }));
    },

    // Implements the interface from utils/DragAndDrop
    reorder: (_: any, id: string, newIndex: number) => {
      reorder(id, newIndex);
    },
  };

  return state;
}
