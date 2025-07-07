import React from "react";
import Modal from "../../Modal";

import { PrimaryButton, SecondaryButton } from "../../Button";
import { PrivacyField } from "../../PrivacyField";
import { SpaceField } from "../../SpaceField";
import { SwitchToggle } from "../../SwitchToggle";
import { TextField } from "../../TextField";
import { showErrorToast } from "../../Toasts";

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
      <h1 className="font-bold text-xl w-52">Add new {state.itemType === "goal" ? "Goal" : "Project"}</h1>

      <div className="mb-2">
        {props.parentGoal && (
          <div className="text-xs text-content-dimmed mb-1">
            Adding under <span className="font-medium">{props.parentGoal.name}</span>
          </div>
        )}
      </div>

      <RadioGroup
        options={[
          {
            value: "goal",
            label: "Goal",
            description: "big-picture outcome",
          },
          {
            value: "project",
            label: "Project",
            description: "concrete actions or deliverables",
          },
        ]}
        value={state.itemType}
        onChange={state.setItemType}
      />

      <div>
        <div className="flex flex-col gap-4 mt-4">
          <TextField
            autofocus
            label="Name"
            variant="form-field"
            placeholder={
              state.itemType === "goal" ? "e.g. Increase user acquisition" : "e.g. Implement new website design"
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
          <SwitchToggle value={state.createMore} setValue={state.setCreateMore} label="Create more" />

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

interface RadioCardOption {
  value: "goal" | "project";
  label: string;
  description: string;
}

interface RadioGroupProps {
  options: RadioCardOption[];
  value: "goal" | "project";
  onChange: (value: "goal" | "project") => void;
}

function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <fieldset className="w-full">
      <div role="radiogroup" aria-labelledby="item-type-label">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center cursor-pointer py-0.5"
            data-test-id={`type-${option.value}`}
          >
            <input
              type="radio"
              name="item-type"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="form-radio accent-indigo-500 mr-2"
              aria-checked={value === option.value}
            />
            <div className="text-sm">
              <span className="font-medium">{option.label}</span>
              <span className="text-content-dimmed"> - {option.description}</span>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
