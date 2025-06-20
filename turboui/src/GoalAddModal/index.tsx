import React, { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import { Modal } from "../Modal";
import { SpaceField } from "../SpaceField";
import { TextField } from "../TextField";

interface GoalAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    dueDate: Date | null;
    space: SpaceField.Space | null;
    parentGoal: GoalField.Goal | null;
  }) => void;
}

export function GoalAddModal({ isOpen, onClose, onAdd }: GoalAddModalProps) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [space, setSpace] = useState<SpaceField.Space | null>(null);
  const [parentGoal, setParentGoal] = useState<GoalField.Goal | null>(null);

  // Dummy search functions, replace with real ones
  const searchSpaces = async () => [];
  const searchGoals = async () => [];

  const handleAdd = () => {
    onAdd({ name, dueDate, space, parentGoal });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Goal" size="medium">
      <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 400 }}>
        <TextField
          text={name}
          onSave={async (val) => {
            setName(val);
            return true;
          }}
          placeholder="Goal name"
        />
        <DateField date={dueDate} setDate={setDueDate} placeholder="Due date" variant="form-field" />
        <SpaceField space={space} setSpace={setSpace} search={searchSpaces} variant="form-field" />
        <GoalField goal={parentGoal} setGoal={setParentGoal} searchGoals={searchGoals} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={handleAdd}>Add</PrimaryButton>
      </div>
    </Modal>
  );
}
