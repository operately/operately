import React from "react";

import { useFieldValue } from "@/components/Forms/FormContext";
import { Target, TargetNumericFields, TargetTextFields } from "./types";
import { useTargetsValidator } from "./targetErrors";

interface Props {
  children: React.ReactNode;
  field: string;
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
  targetOpen: string | undefined;
}

export function TargetsContextProvider({ children, field }: Props) {
  const [targets, setTargets] = useFieldValue<Target[]>(field);
  const [targetOpen, setTargetOpen] = React.useState<string>();
  const originalTargets = React.useRef(targets);
  const validate = useTargetsValidator(targets);

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

  const contextValue = React.useMemo(
    () => ({
      editNumericValue,
      editTextValue,
      addTarget,
      deleteTarget,
      startEdit,
      closeEdit,
      resetEdit,

      targets,
      targetOpen,
    }),
    [targets, targetOpen],
  );

  return <TargetsContext.Provider value={contextValue}>{children}</TargetsContext.Provider>;
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
    id: crypto.randomUUID(),
    name: "",
    from: undefined,
    to: undefined,
    unit: "",
    value: 0,
  };
}
