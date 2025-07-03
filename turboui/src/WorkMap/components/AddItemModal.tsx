import React from "react";
import Modal from "../../Modal";

import { PrimaryButton, SecondaryButton } from "../../Button";
import { PrivacyField } from "../../PrivacyField";
import { SpaceField } from "../../SpaceField";
import { TextField } from "../../TextField";
import { showErrorToast } from "../../Toasts";

namespace AddItemModel {
  interface SaveProps {
    name: string;
    type: "goal" | "project";
    spaceId: string;
    accessLevels: PrivacyField.AccessLevels;
  }

  export interface Props {
    isOpen: boolean;
    close: () => void;
    space: SpaceField.Space;
    parentGoal: { name: string };
    spaceSearch: SpaceField.SearchSpaceFn;
    save: (props: SaveProps) => Promise<{ id: string }>;
  }

  export type ItemType = "goal" | "project";

  export interface State {
    itemType: ItemType;
    setItemType: (type: ItemType) => void;
    name: string;
    setName: (name: string) => void;
    space: SpaceField.Space | null;
    setSpace: (space: SpaceField.Space | null) => void;
    spaceSearch: SpaceField.SearchSpaceFn;
    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;
    submit: () => Promise<void>;
    submitting: boolean;
  }
}

export function AddItemModal(props: AddItemModel.Props) {
  const state = useAddItemModalState(props);

  return (
    <Modal isOpen={props.isOpen} onClose={props.close} size="medium" closeOnBackdropClick={false}>
      <div className="flex items-start justify-between mb-4">
        <div className="">
          <h1 className="font-bold text-xl">{state.itemType === "goal" ? "Add New Goal" : "Add New Project"}</h1>
          <div className="text-sm">
            Under: <span className="font-medium">{props.parentGoal.name}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap-3 text-sm mb-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="goalOrProject"
              value="goal"
              checked={state.itemType === "goal"}
              className="accent-blue-600"
              onChange={() => state.setItemType("goal")}
            />
            <span>Sub-Goal</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="goalOrProject"
              value="project"
              checked={state.itemType === "project"}
              className="accent-blue-600"
              onChange={() => state.setItemType("project")}
            />
            <span>Project</span>
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            autofocus
            label="Name"
            variant="form-field"
            placeholder="What do you want to achieve?"
            text={state.name}
            onChange={state.setName}
            error={state.nameError}
            testId="goal-name"
          />

          <SpaceField
            label="Space"
            space={state.space}
            setSpace={state.setSpace}
            search={state.spaceSearch}
            variant="form-field"
            testId="space-field"
            error={state.spaceError}
          />

          <PrivacyField
            accessLevels={state.accessLevels}
            setAccessLevels={state.setAccessLevels}
            resourceType={"goal"}
            variant="form-field"
            label="Privacy"
          />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <PrimaryButton onClick={state.submit} loading={state.submitting} testId="submit" size="sm">
            Add Goal
          </PrimaryButton>

          <SecondaryButton type="button" data-testid="cancel" size="sm">
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}

function useAddItemModalState(props: AddItemModel.Props) {
  const [itemType, setItemType] = React.useState<"goal" | "project">("project");
  const [name, setName] = React.useState("");
  const [space, setSpace] = React.useState<SpaceField.Space | null>(props.space || null);
  const [nameError, setNameError] = React.useState<string | undefined>(undefined);
  const [spaceError, setSpaceError] = React.useState<string | undefined>(undefined);
  const [accessLevels, setAccessLevels] = React.useState<PrivacyField.AccessLevels>({
    company: "edit",
    space: "edit",
  });

  const [submitting, setSubmitting] = React.useState(false);

  const validate = (): boolean => {
    let ok = true;

    if (name.trim() === "") {
      setNameError("Cannot be empty");
      ok = false;
    } else {
      setNameError(undefined);
    }

    if (!space) {
      setSpaceError("Please select a space");
      ok = false;
    } else {
      setSpaceError(undefined);
    }

    return ok;
  };

  const submit = async () => {
    setSubmitting(true);

    try {
      if (!validate()) {
        return;
      }

      await props.save({
        name: name.trim(),
        type: itemType,
        spaceId: space!.id,
        accessLevels,
      });

      setNameError(undefined);
      setSpaceError(undefined);
    } catch (error) {
      console.error("Failed to create goal:", error);
      showErrorToast("Network error", "Failed to create the goal");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    name,
    setName,
    itemType,
    setItemType,
    space,
    setSpace,
    nameError,
    spaceError,
    spaceSearch: props.spaceSearch,
    accessLevels,
    setAccessLevels,
    submit,
    submitting,
  };
}
