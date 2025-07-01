import React from "react";

import { PrimaryButton } from "../Button";
import { Page } from "../Page";
import { PrivacyField } from "../PrivacyField";
import { SpaceField } from "../SpaceField";
import { TextField } from "../TextField";

export function GoalAddPage(props: GoalAddForm.Props) {
  return (
    <Page title="Add a new goal" testId="goal-add-page" size="small">
      <div className="p-8">
        <GoalAddForm {...props} />
      </div>
    </Page>
  );
}

//
// Form definition for adding a goal
//

export namespace GoalAddForm {
  export interface Props {
    space?: SpaceField.Space | null;
    spaceSearch: SpaceField.SearchSpaceFn;
  }

  export interface State {
    name: string;
    setName: (name: string) => void;
    space: SpaceField.Space | null;
    setSpace: (space: SpaceField.Space | null) => void;
    nameError: string | undefined;
    spaceError: string | undefined;
    spaceSearch: SpaceField.SearchSpaceFn;
    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;
    submit: () => Promise<void>;
    submitting: boolean;
  }
}

export function GoalAddForm(props: GoalAddForm.Props) {
  const state = useFormState(props);

  return (
    <div>
      <h1 className="mb-4 font-bold text-xl">Add a new goal</h1>

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

      <div className="mt-6">
        <PrimaryButton onClick={state.submit} loading={state.submitting} testId="submit" size="sm">
          Add Goal
        </PrimaryButton>
      </div>
    </div>
  );
}

function useFormState(props: GoalAddForm.Props): GoalAddForm.State {
  const [name, setName] = React.useState("");
  const [space, setSpace] = React.useState<SpaceField.Space | null>(props.space || null);
  const [nameError, setNameError] = React.useState<string | undefined>(undefined);
  const [spaceError, setSpaceError] = React.useState<string | undefined>(undefined);
  const [accessLevels, setAccessLevels] = React.useState<PrivacyField.AccessLevels>({
    company: "edit",
    space: "edit",
  });

  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      // Implement submission logic here
      // Reset errors if successful
      setNameError(undefined);
      setSpaceError(undefined);
    } catch (error) {
      // Handle errors and set error messages
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    name,
    setName,
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
