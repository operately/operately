import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { useLoadedData } from "./loader";
import { FormState, useForm, Form } from "@/features/goals/GoalForm";
import { useMe } from "@/contexts/CurrentUserContext";
import { Paths } from "@/routes/paths";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";


export function Page() {
  const me = useMe();
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

  return (
    <PermissionsProvider company={company} space={space || form.fields.space} >
      {spaceID ?
        <NewGoalForSpacePage form={form} />
      :
        <NewGoalPage form={form} />
      }
    </PermissionsProvider>
  );
}

function NewGoalForSpacePage({ form }: { form: FormState }) {
  const { space } = useLoadedData();

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="large">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={Paths.spacePath(space!.id!)}>Back to {space!.name} Space</DimmedLink>
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

function NewGoalPage({ form }: { form: FormState }) {
  const { isCompanyWide } = useLoadedData();

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="large">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={Paths.goalsPath()}>Back to Goals</DimmedLink>
        </div>

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
  const { permissions } = usePermissionsContext();

  const handleSubmit = () => {
    form.submit(permissions);
  }

  return (
    <div className="mt-8">
      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}

      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={handleSubmit}
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
