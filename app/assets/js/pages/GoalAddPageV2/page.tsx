import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { PrimaryButton, TextField } from "turboui";

interface PageState {
  name: string;
  setName: (name: string) => void;
  nameError: string | undefined;
  submit: () => boolean;
  submitting: boolean;
}

function usePageState(): PageState {
  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | undefined>(undefined);

  const submit = () => {
    if (name.trim() === "") {
      setNameError("Cannot be empty");
      return false;
    }

    return true; // TODO: Implement actual submission logic
  };

  return {
    name,
    setName,
    nameError,
    submit,
    submitting: false, // TODO: Fix this
  };
}

export function Page() {
  const state = usePageState();

  return (
    <Pages.Page title="New Goal" testId="goal-add-page">
      <Paper.Root size="small">
        <h1 className="mb-4 font-bold text-3xl text-center">Add a new goal</h1>
        <Paper.Body minHeight="300px">
          <TextField
            label="Goal Name"
            variant="form-field"
            placeholder="What do you want to achieve?"
            text={state.name}
            onChange={state.setName}
            error={state.nameError}
          />
        </Paper.Body>
        <SubmitButton state={state} />
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ state }: { state: PageState }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-center gap-4">
        <PrimaryButton onClick={state.submit} loading={state.submitting} size="lg" testId="add-goal-button">
          Add Goal
        </PrimaryButton>
      </div>
    </div>
  );
}
