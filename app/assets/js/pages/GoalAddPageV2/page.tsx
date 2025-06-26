import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { PrimaryButton, TextField } from "turboui";

interface PageState {
  name: string;
  setName: (name: string) => void;
  submit: () => boolean;
  submitting: boolean;
}

function usePageState(): PageState {
  const [name, setName] = React.useState("");

  const submit = () => {
    return true;
  };

  return {
    name,
    setName,
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
            onSave={async (newName) => {
              state.setName(newName);
              return true; // Simulate successful save
            }}
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
      {/* {form.errors.length > 0 && (
        <div className="text-content-error text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )} */}

      <div className="flex items-center justify-center gap-4">
        <PrimaryButton onClick={state.submit} loading={state.submitting} size="lg" testId="add-goal-button">
          Add Goal
        </PrimaryButton>
      </div>
    </div>
  );
}
