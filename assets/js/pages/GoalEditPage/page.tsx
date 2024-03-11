import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";
import { FormState, useForm, Form } from "@/features/GoalForm";

export function Page() {
  const { company, me, goal } = useLoadedData();
  const form = useForm("edit", company, me, { allowSpaceSelection: false }, goal);

  return (
    <Pages.Page title={["Edit", goal.name]}>
      <Paper.Root size="medium">
        <Paper.Body minHeight="300px">
          <Header form={form} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form }: { form: FormState }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between mx-10 my-2">
          <h1 className="text-xl font-extrabold">Editing the goal</h1>

          <div className="flex items-center gap-2">
            <FilledButton type="secondary" onClick={form.cancel} size="sm" testId="cancel-edit">
              Cancel
            </FilledButton>

            <FilledButton
              type="primary"
              onClick={form.submit}
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

      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}
    </div>
  );
}
