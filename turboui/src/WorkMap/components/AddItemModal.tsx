import React from "react";
import Modal from "../../Modal";

import { PrimaryButton, SecondaryButton } from "../../Button";
import { PrivacyField } from "../../PrivacyField";
import { SpaceField } from "../../SpaceField";
import { TextField } from "../../TextField";
import { showErrorToast } from "../../Toasts";

import * as Switch from "@radix-ui/react-switch";

export namespace AddItemModal {
  export interface SaveProps {
    name: string;
    type: "goal" | "project";
    space: SpaceField.Space;
    parentId: string | null;
    accessLevels: PrivacyField.AccessLevels;
  }

  export interface Props {
    isOpen: boolean;
    close: () => void;
    space: SpaceField.Space;
    parentGoal: { id: string; name: string } | null;
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

export function AddItemModal(props: AddItemModal.Props) {
  const state = useAddItemModalState(props);

  return (
    <Modal isOpen={props.isOpen} onClose={props.close} size="medium" closeOnBackdropClick={false}>
      <div className="flex items-start justify-between mb-4">
        <div className="">
          <h1 className="font-bold text-xl">{state.itemType === "goal" ? "Add New Goal" : "Add New Project"}</h1>

          {props.parentGoal && (
            <div className="text-sm">
              Under: <span className="font-medium">{props.parentGoal.name}</span>
            </div>
          )}
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
              data-test-id="type-goal"
            />
            <span>Goal</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="goalOrProject"
              value="project"
              checked={state.itemType === "project"}
              className="accent-blue-600"
              onChange={() => state.setItemType("project")}
              data-test-id="type-project"
            />
            <span>Project</span>
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            autofocus
            label="Name"
            variant="form-field"
            placeholder={
              state.itemType === "goal" ? "e.g. Increase user acqisition" : "e.g. Implement new website design"
            }
            text={state.name}
            onChange={state.setName}
            error={state.nameError}
            testId="item-name"
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
            resourceType={state.itemType}
            variant="form-field"
            label="Privacy"
          />
        </div>

        <div className="flex items-center mt-6">
          <SwitchToggle value={state.createMore} setValue={state.setCreateMore} />

          <div className="flex-1"></div>
          <div className="flex space-x-3">
            <SecondaryButton type="button" data-testid="cancel" size="sm" onClick={props.close}>
              Cancel
            </SecondaryButton>

            <PrimaryButton onClick={state.submit} loading={state.submitting} testId="submit" size="sm">
              Add {state.itemType === "goal" ? "Goal" : "Project"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SwitchToggle({ value, setValue }: { value: boolean; setValue: (value: boolean) => void }) {
  return (
    <div className="flex items-center">
      <Switch.Root
        checked={value}
        onCheckedChange={setValue}
        className={`w-11 h-6 rounded-full relative outline-none cursor-pointer focus:ring-2 focus:ring-primary-base focus:ring-offset-2 transition-all duration-200 ${
          value ? "bg-brand-1" : "bg-content-dimmed"
        }`}
      >
        <Switch.Thumb className="block w-5 h-5 bg-brand-2 border border-stroke-base rounded-full shadow-md transform transition-all duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
      <label className="ml-3 text-sm text-content-base cursor-pointer" onClick={() => setValue(!value)}>
        Create more
      </label>
    </div>
  );
}

function useAddItemModalState(props: AddItemModal.Props) {
  const [itemType, setItemType] = React.useState<"goal" | "project">("goal");
  const [name, setName] = React.useState("");
  const [space, setSpace] = React.useState<SpaceField.Space | null>(props.space || null);
  const [nameError, setNameError] = React.useState<string | undefined>(undefined);
  const [spaceError, setSpaceError] = React.useState<string | undefined>(undefined);
  const [createMore, setCreateMore] = React.useState(false);

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
        space: space!,
        accessLevels,
        parentId: props.parentGoal ? props.parentGoal.id : null,
      });

      setName("");
      setSpace(props.space || null);
      setNameError(undefined);
      setSpaceError(undefined);

      if (!createMore) {
        props.close();
      }
    } catch (error) {
      console.error("Failed to create goal:", error);
      showErrorToast("Network error", "Failed to create the " + itemType + ".");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    createMore,
    setCreateMore,

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
