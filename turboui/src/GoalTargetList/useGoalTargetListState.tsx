import * as React from "react";

import { GoalTargetList } from ".";

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

  reorder: (itemId: string, newIndex: number) => void;
}

export function useGoalTargetListState(props: GoalTargetList.Props): State {
  const [targets, setTargetsState] = React.useState<TargetState[]>(() => initializeTargets(props));
  const targetsRef = React.useRef<TargetState[]>(targets);

  const replaceTargets = React.useCallback((next: TargetState[]) => {
    targetsRef.current = next;
    setTargetsState(next);
  }, []);

  const updateTargets = React.useCallback(
    (updater: (prev: TargetState[]) => TargetState[]) => {
      replaceTargets(updater(targetsRef.current));
    },
    [replaceTargets],
  );

  React.useEffect(() => {
    replaceTargets(mergeTargets(targetsRef.current, props));
  }, [props.targets, props.showEditButton, props.showUpdateButton, replaceTargets]);

  const updateTargetState = React.useCallback(
    (id: string, updater: (target: TargetState) => TargetState) => {
      updateTargets((prev) => prev.map((target) => (target.id === id ? updater(target) : target)));
    },
    [updateTargets],
  );

  const state: State = {
    targets,
    addActive: !!props.addActive,

    addTarget: (values) => {
      props.addTarget({
        name: values.name,
        startValue: values.from,
        targetValue: values.to,
        unit: values.unit,
      });
    },

    toggleExpand: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, expanded: !target.expanded }));
    },

    cancelAdd: () => {
      props.onAddActiveChange?.(false);
    },

    startUpdating: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "update" as const }));
    },
    cancelUpdate: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "view" as const }));
    },
    updateTarget: (id: string, newValue: number) => {
      updateTargetState(id, (target) => ({ ...target, value: newValue, mode: "view" as const }));
      props.updateTargetValue(id, newValue);
    },

    startEditing: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "edit" as const }));
    },
    cancelEdit: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "view" as const }));
    },
    saveEdit: (id: string, values: { name: string; from: number; to: number; unit: string }) => {
      updateTargetState(id, (target) => ({ ...target, ...values, mode: "view" as const }));

      props.updateTarget({
        targetId: id,
        name: values.name,
        startValue: values.from,
        targetValue: values.to,
        unit: values.unit,
      });
    },

    startDeleting: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "delete" as const }));
    },
    deleteTarget: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "view" as const }));
      props.deleteTarget(id);
    },
    cancelDelete: (id: string) => {
      updateTargetState(id, (target) => ({ ...target, mode: "view" as const }));
    },

    reorder: (itemId: string, newIndex: number) => {
      const current = targetsRef.current.find((target) => target.id === itemId);
      if (!current || current.index === newIndex) {
        return;
      }

      props.updateTargetIndex(itemId, newIndex);
    },
  };

  return state;
}

function initializeTargets(props: GoalTargetList.Props): TargetState[] {
  return mergeTargets([], props);
}

function mergeTargets(previous: TargetState[], props: GoalTargetList.Props): TargetState[] {
  const previousMap = new Map(previous.map((target) => [target.id, target]));

  return props.targets.map((target) => {
    const prev = previousMap.get(target.id);

    return {
      ...target,
      expanded: prev?.expanded ?? false,
      editButtonVisible: !!props.showEditButton,
      updateButtonVisible: !!props.showUpdateButton,
      mode: prev?.mode ?? target.mode,
    };
  });
}
