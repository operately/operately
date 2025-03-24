import React from "react";
import { REQUIRED_FIELDS, Target, TargetNumericFields, TargetTextFields } from "./types";

interface Props {
  children: React.ReactNode;
  targets: Target[];
  updateTargets: (targets: Target[]) => void;
}

interface Error {
  id: string;
  field: TargetNumericFields | TargetTextFields;
}

interface TargetsContextValue {
  editNumericValue: (id: string, value: string | number, field: TargetNumericFields) => void;
  editTextValue: (id: string, value: string, field: TargetTextFields) => void;
  addTarget: () => void;
  deleteTarget: (id: string | undefined) => void;
  startEdit: (id: string) => void;
  confirmEdit: (id: string | undefined) => void;
  cancelEdit: (id: string | undefined) => void;

  targets: Target[];
  errors: Error[];
  targetOpen: string | undefined;
}

export function TargetsContextProvider({ children, targets, updateTargets }: Props) {
  const [tmpTargets, setTmpTargets] = React.useState(copyTargets(targets));
  const [targetOpen, setTargetOpen] = React.useState<string>();
  const [errors, setErrors] = React.useState<Error[]>([]);

  const editTargetValue = (id: string, value: string | number, field: TargetTextFields | TargetNumericFields) => {
    setTmpTargets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      }),
    );
  };

  const editNumericValue = (id: string, value: string | number, field: TargetNumericFields) => {
    if (typeof value === "number" || /^(\d*\.?\d*)?$/.test(value)) {
      editTargetValue(id, value, field);
    }
  };

  const editTextValue = (id: string, value: string | number, field: TargetTextFields) => {
    editTargetValue(id, value, field);
  };

  const addTarget = () => {
    if (validate(targetOpen)) {
      const target = newEmptyTarget();
      setTmpTargets((prev) => [...prev, target]);
      setTargetOpen(target.id!);
    }
  };

  const deleteTarget = (id: string | undefined) => {
    if (!id) return;
    setTmpTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (id: string) => {
    if (!targetOpen || validate(targetOpen)) {
      setTargetOpen(id);
    }
  };

  const confirmEdit = (id: string | undefined) => {
    if (validate(id)) {
      const target = tmpTargets.find((t) => t.id === id);

      if (!target) return;

      updateTargets(
        targets.map((t) => {
          if (t.id === target.id) {
            return target;
          }
          return t;
        }),
      );

      setTargetOpen(undefined);
    }
  };

  const cancelEdit = (id: string | undefined) => {
    const target = targets.find((t) => t.id === id);

    if (!id || !target) return;

    setTmpTargets((prev) =>
      prev.map((t) => {
        if (t.id === target.id) return target;
        return t;
      }),
    );
    setTargetOpen(undefined);
  };

  const validate = (id: string | undefined) => {
    const target = tmpTargets.find((t) => t.id === id);
    const tmpErrors: Error[] = [];

    if (!id || !target) return true;

    for (let field of REQUIRED_FIELDS) {
      if (!target[field] && target[field] !== 0) {
        tmpErrors.push({ id, field });
      }
    }

    if (tmpErrors.length > 0) {
      setErrors(tmpErrors);
      return false;
    }
    return true;
  };

  const data = {
    editNumericValue,
    editTextValue,
    addTarget,
    deleteTarget,
    startEdit,
    confirmEdit,
    cancelEdit,

    targets: tmpTargets,
    targetOpen,
    errors,
  };

  return <TargetsContext.Provider value={data}>{children}</TargetsContext.Provider>;
}

const TargetsContext = React.createContext<TargetsContextValue | null>(null);

export function useTargetsContext() {
  const context = React.useContext(TargetsContext);

  if (!context) throw new Error("useTargetsContext must be within a TargetsContextProvider");

  return context;
}

function copyTargets(targets: Target[]): Target[] {
  return targets.map((t) => {
    return { ...t };
  });
}

function newEmptyTarget(): Target {
  return {
    isNew: true,
    id: Math.random().toString(),
    name: "",
    from: undefined,
    to: undefined,
    unit: "",
  };
}
