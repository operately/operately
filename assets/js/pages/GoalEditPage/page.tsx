import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";
import { FormState, useForm, Form } from "@/features/goals/GoalForm";
import { useMe } from "@/contexts/CurrentUserContext";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";


export function Page() {
  const me = useMe();
  const { company, goal } = useLoadedData();

  const form = useForm({
    mode: "edit",
    company,
    me,
    allowSpaceSelection: false,
    goal,
  });

  return (
    <Pages.Page title={["Edit", goal.name!]}>
      <Paper.Root size="medium">
        <Paper.Body minHeight="300px">
          <PermissionsProvider company={company} space={goal.space} >
            <Header form={form} />
            <ErrorMessage form={form} />
            <Form form={form} />
          </PermissionsProvider>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form }: { form: FormState }) {
  const { permissions } = usePermissionsContext();

  const handleSubmit = () => {
    form.submit(permissions);
  }

  return (
    <Paper.Header className="bg-surface-dimmed">
      <div className="flex items-end justify-between my-2">
        <h1 className="text-xl font-extrabold">Editing the goal</h1>

        <div className="flex items-center gap-2">
          <FilledButton type="secondary" onClick={form.cancel} size="sm" testId="cancel-edit">
            Cancel
          </FilledButton>

          <FilledButton
            type="primary"
            onClick={handleSubmit}
            loading={form.submitting}
            size="sm"
            testId="save-changes"
            bzzzOnClickFailure
          >
            Save Changes
          </FilledButton>
        </div>
      </div>
    </Paper.Header>
  );
}

function ErrorMessage({ form }: { form: FormState }) {
  if (form.errors.length === 0) return null;

  return <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>;
}
