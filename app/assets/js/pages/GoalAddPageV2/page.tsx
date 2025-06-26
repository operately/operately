import Api from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useCreateGoal } from "@/api";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, showErrorToast, SpaceField, TextField } from "turboui";

interface PageState {
  name: string;
  setName: (name: string) => void;
  space: SpaceField.Space | null;
  setSpace: (space: SpaceField.Space | null) => void;
  nameError: string | undefined;
  spaceError: string | undefined;
  spaceSearch: SpaceField.SearchSpaceFn;
  submit: () => Promise<void>;
  submitting: boolean;
}

export function Page() {
  const state = usePageState();

  return (
    <Pages.Page title="New Goal" testId="goal-add-page">
      <Paper.Root size="tiny">
        <Paper.Body>
          <h1 className="mb-4 font-bold text-xl">Add a new goal</h1>

          <div className="flex flex-col gap-4">
            <TextField
              label="Name"
              variant="form-field"
              placeholder="What do you want to achieve?"
              text={state.name}
              onChange={state.setName}
              error={state.nameError}
            />

            <SpaceField
              label="Space"
              space={state.space}
              setSpace={state.setSpace}
              search={state.spaceSearch}
              variant="form-field"
              testId="goal-add-space-field"
              error={state.spaceError}
            />
          </div>

          <div className="mt-6">
            <PrimaryButton onClick={state.submit} loading={state.submitting} testId="add-goal-button" size="sm">
              Add Goal
            </PrimaryButton>
          </div>
        </Paper.Body>

        <div className="my-8 text-center px-10">
          <span className="font-bold">What happens next?</span> A new draft goal will be added to the selected space.
          Only you can see it until you publish it.
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}

function usePageState(): PageState {
  const paths = usePaths();
  const navigate = useNavigate();

  const [create, { loading: submitting }] = useCreateGoal();

  const [name, setName] = React.useState("");
  const [space, setSpace] = React.useState<SpaceField.Space | null>(null);

  const [nameError, setNameError] = React.useState<string | undefined>(undefined);
  const [spaceError, setSpaceError] = React.useState<string | undefined>(undefined);

  const spaceSearch = useSpaceSearch();

  const submit = async () => {
    if (name.trim() === "") {
      setNameError("Cannot be empty");
      return;
    }

    if (space === null) {
      setSpaceError("Please select a space");
      return;
    }

    try {
      const res = await create({
        name: name.trim(),
        spaceId: space?.id || null,
        anonymousAccessLevel: 40,
        companyAccessLevel: 40,
        spaceAccessLevel: 40,
      });

      setNameError(undefined);
      setName("");
      navigate(paths.goalPath(res.data.id));
    } catch (error) {
      showErrorToast("Network error", "Failed to create the goal");
      throw error; // rethrow to let the caller handle it
    }
  };

  return {
    name,
    setName,
    nameError,
    space,
    setSpace,
    spaceError,
    spaceSearch,
    submit,
    submitting,
  };
}

function useSpaceSearch(): SpaceField.SearchSpaceFn {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<SpaceField.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      link: paths.spacePath(space.id!),
    }));
  };
}
