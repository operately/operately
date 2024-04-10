import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { useLoadedData } from "./loader";
import { FormState, useForm, Form } from "@/features/goals/GoalForm";

export function Page() {
  const { spaceID } = useLoadedData();

  if (spaceID) {
    return <NewGoalForSpacePage />;
  } else {
    return <NewGoalPage />;
  }
}

function NewGoalForSpacePage() {
  const { company, me, space, parentGoal } = useLoadedData();

  const form = useForm({
    mode: "create",
    company: company,
    me: me,
    allowSpaceSelection: false,
    space: space,
    parentGoal,
  });

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="large">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={`/spaces/${space!.id}/goals`}>Back to {space!.name} Space</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new subgoal for {space!.name}</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function NewGoalPage() {
  const { company, me, spaces, parentGoal } = useLoadedData();

  const form = useForm({
    mode: "create",
    company: company,
    me: me,
    allowSpaceSelection: true,
    spaces: spaces,
    parentGoal,
  });

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="large">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={`/goals`}>Back to Goals</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new goal</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <div className="mt-8">
      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}

      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={form.submit}
          loading={form.submitting}
          size="lg"
          testId="add-goal-button"
          bzzzOnClickFailure
        >
          Add Goal
        </FilledButton>
      </div>
    </div>
  );
}
