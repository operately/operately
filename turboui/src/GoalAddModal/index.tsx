import React, { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import { Modal } from "../Modal";
import { SpaceField } from "../SpaceField";
import { TextField } from "../TextField";

export namespace GoalAddModal {
  export interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: {
      name: string;
      dueDate: Date | null;
      space: SpaceField.Space | null;
      parentGoal: GoalField.Goal | null;
    }) => void;
  }
}

export function GoalAddModal({ isOpen, onClose, onAdd }: GoalAddModal.Props) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [space, setSpace] = useState<SpaceField.Space | null>(null);
  const [parentGoal, setParentGoal] = useState<GoalField.Goal | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [createMore, setCreateMore] = useState(false);

  // Dummy search functions, replace with real ones
  const searchSpaces = async () => [];
  const searchGoals = async () => [];

  const handleAdd = () => {
    onAdd({ name, dueDate, space, parentGoal });
    if (!createMore) {
      onClose();
    } else {
      setName("");
      setDueDate(null);
      setSpace(null);
      setParentGoal(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="flex flex-col min-w-[400px]">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold">Add a new goal</p>
        </div>

        <label className="mb-1 text-sm font-bold block mt-2">Goal name</label>
        <div className="border rounded-lg border-surface-outline px-2 py-1.5 mb-2">
          <TextField
            text={name}
            onSave={async (val) => {
              setName(val);
              return true;
            }}
            placeholder="e.g. Increase sales by 20%"
          />
        </div>

        {showDetails && (
          <div>
            <label className="mb-1 text-sm font-bold block mt-2">Details</label>
            <div className="grid grid-cols-1 gap-3 mt-2">
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Due date</label>
                <DateField date={dueDate} setDate={setDueDate} emptyStateText="Select date" />
              </div>
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Space</label>
                <SpaceField space={space} setSpace={setSpace} search={searchSpaces} />
              </div>
              <div className="flex items-center">
                <label className="w-32 text-sm font-medium text-gray-700">Parent goal</label>
                <GoalField goal={parentGoal} setGoal={setParentGoal} searchGoals={searchGoals} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center gap-3 mt-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none mr-2">
          <input
            type="checkbox"
            checked={showDetails}
            onChange={(e) => setShowDetails(e.target.checked)}
            className="accent-primary"
          />
          Set details
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none mr-2">
          <input
            type="checkbox"
            checked={createMore}
            onChange={(e) => setCreateMore(e.target.checked)}
            className="accent-primary"
          />
          Create more
        </label>
        <SecondaryButton size="xs" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton size="xs" onClick={handleAdd}>
          Add
        </PrimaryButton>
      </div>
    </Modal>
  );
}
