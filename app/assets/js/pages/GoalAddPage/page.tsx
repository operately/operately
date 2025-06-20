import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Form, FormState, useForm } from "@/features/goals/GoalForm";
import { PrimaryButton } from "turboui";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const me = useMe()!;
  const { spaceID, space, spaces, company, parentGoal, goals, isCompanyWide } = useLoadedData();

  const form = useForm({
    mode: "create",
    company: company,
    me: me,
    allowSpaceSelection: Boolean(isCompanyWide || !space),
    space: space,
    spaces: spaces,
    parentGoal,
    parentGoalOptions: goals,
    isCompanyWide,
  });

  return spaceID ? <NewGoalForSpacePage form={form} /> : <NewGoalPage form={form} />;
}

function NewGoalForSpacePage({ form }: { form: FormState }) {
  const paths = usePaths();
  const { space } = useLoadedData();

  return (
    <Pages.Page title="New Goal" testId="goal-add-page">
      <Paper.Root size="large">
        <Paper.NavigateBack to={paths.workMapPath()} title={`Back to ${space!.name} Space`} />

        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new subgoal for {space!.name}</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function NewGoalPage({ form }: { form: FormState }) {
  const paths = usePaths();
  const { isCompanyWide } = useLoadedData();

  return (
    <Pages.Page title="New Goal" testId="goal-add-page">
      <Paper.Root size="large">
        <Paper.NavigateBack to={paths.workMapPath()} title="Back to Work Map" />

        <h1 className="mb-4 font-bold text-3xl text-center">
          Adding a new {isCompanyWide ? "company-wide" : " "} goal
        </h1>

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
        <div className="text-content-error text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}

      <div className="flex items-center justify-center gap-4">
        <PrimaryButton onClick={form.submit} loading={form.submitting} size="lg" testId="add-goal-button">
          Add Goal
        </PrimaryButton>
      </div>
    </div>
  );
}
