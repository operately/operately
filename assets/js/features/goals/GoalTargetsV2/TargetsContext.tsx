import React from "react";
import { REQUIRED_FIELDS, Target, TargetNumericFields, TargetTextFields } from "./types";

interface Props {
  children: React.ReactNode;
  targets: Target[];
  setTargets: (targets: Target[]) => void;
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
  closeEdit: (id: string | undefined) => void;
  resetEdit: (id: string | undefined) => void;

  targets: Target[];
  errors: Error[];
  targetOpen: string | undefined;
}

export function TargetsContextProvider({ children, targets, setTargets }: Props) {
  const originalTargets = React.useRef(targets);
  const [targetOpen, setTargetOpen] = React.useState<string>();
  const [errors, setErrors] = React.useState<Error[]>([]);

  const editTargetValue = (id: string, value: string | number, field: TargetTextFields | TargetNumericFields) => {
    setTargets(
      targets.map((t) => {
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
      setTargets([...targets, target]);
      setTargetOpen(target.id!);
    }
  };

  const deleteTarget = (id: string | undefined) => {
    if (!id) return;
    setTargets(targets.filter((t) => t.id !== id));
  };

  const startEdit = (id: string) => {
    if (!targetOpen || validate(targetOpen)) {
      setTargetOpen(id);
    }
  };

  const closeEdit = (id: string | undefined) => {
    if (validate(id)) {
      setTargetOpen(undefined);
    }
  };

  const resetEdit = (id: string | undefined) => {
    const target = originalTargets.current.find((t) => t.id === id);

    if (!id || !target) return;

    setTargets(
      targets.map((t) => {
        if (t.id === target.id) return target;
        return t;
      }),
    );
    setTargetOpen(undefined);
  };

  const validate = (id: string | undefined) => {
    const target = targets.find((t) => t.id === id);
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
    closeEdit,
    resetEdit,

    targets,
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
