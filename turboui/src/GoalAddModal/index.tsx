import React, { useState } from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { GoalField } from "../GoalField";
import { Modal } from "../Modal";
import { PersonField } from "../PersonField";
import { PrivacyField } from "../PrivacyField";
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

    initialChampion?: PersonField.Person | null;
    initialReviewer?: PersonField.Person | null;
    initialDueDate?: Date | null;
    initialSpace?: SpaceField.Space | null;
    initialParentGoal?: GoalField.Goal | null;

    searchSpaces: SpaceField.SearchSpaceFn;
    searchGoals: GoalField.SearchGoalFn;
  }
}

export function GoalAddModal({
  isOpen,
  onClose,
  onAdd,
  initialChampion = null,
  initialReviewer = null,
  initialDueDate = null,
  initialSpace = null,
  initialParentGoal = null,
  searchSpaces,
  searchGoals,
}: GoalAddModal.Props) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(initialDueDate);
  const [space, setSpace] = useState<SpaceField.Space | null>(initialSpace);
  const [parentGoal, setParentGoal] = useState<GoalField.Goal | null>(initialParentGoal);
  const [champion, setChampion] = useState<PersonField.Person | null>(initialChampion);
  const [reviewer, setReviewer] = useState<PersonField.Person | null>(initialReviewer);
  const [showDetails, setShowDetails] = useState(false);
  const [createMore, setCreateMore] = useState(false);
  const [accessLevels, setAccessLevels] = useState<{
    company: "edit" | "view" | "no_access" | "comment" | "full";
    space: "edit" | "view" | "no_access" | "comment" | "full";
  }>({ company: "edit", space: "edit" });

  const handleAdd = () => {
    onAdd({ name, dueDate, space, parentGoal });
    if (!createMore) {
      onClose();
    } else {
      setName("");
      setDueDate(initialDueDate);
      setSpace(initialSpace);
      setParentGoal(initialParentGoal);
      setChampion(initialChampion);
      setReviewer(initialReviewer);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-lg">Add a new goal</p>
        </div>

        <label className="mb-1 text-sm font-bold block mt-4">Name</label>
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

        {!showDetails && (
          <button
            className="bg-surface-dimmed hover:bg-surface-highlight px-2 py-0.5 text-sm rounded-lg transition-colors"
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? "" : "Set details"}
          </button>
        )}

        {showDetails && (
          <>
            <label className="mb-1 text-sm font-bold block mt-4">Details</label>
            <div className="mt-2">
              <div className="grid grid-cols-1">
                <div className="flex items-center border-t border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Champion</label>
                  <PersonField
                    person={champion}
                    setPerson={setChampion}
                    searchPeople={async () => []}
                    emptyStateMessage="Select person"
                    avatarSize={16}
                    showTitle={false}
                  />
                </div>
                <div className="flex items-center border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Reviewer</label>
                  <PersonField
                    person={reviewer}
                    setPerson={setReviewer}
                    searchPeople={async () => []}
                    emptyStateMessage="Select person"
                    avatarSize={16}
                    showTitle={false}
                  />
                </div>
                <div className="flex items-center border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Due date</label>
                  <DateField date={dueDate} setDate={setDueDate} emptyStateText="Select date" iconSize={16} />
                </div>
                <div className="flex items-center border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Space</label>
                  <SpaceField space={space} setSpace={setSpace} search={searchSpaces} iconSize={16} />
                </div>
                <div className="flex items-center border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Parent goal</label>
                  <GoalField goal={parentGoal} setGoal={setParentGoal} searchGoals={searchGoals} iconSize={16} />
                </div>
                <div className="flex items-center border-b border-stroke-base py-2.5">
                  <label className="w-28 text-sm">Privacy</label>
                  <PrivacyField
                    accessLevels={accessLevels}
                    setAccessLevels={setAccessLevels}
                    spaceName={""}
                    resourceType={"goal"}
                    iconSize={16}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end items-center gap-3 mt-4">
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
