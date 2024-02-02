import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";
import { Form, useForm } from "@/features/GoalCheckInForm";

export function Page() {
  const { goal } = useLoadedData();
  const form = useForm({ goal, mode: "create" });

  return (
    <Pages.Page title={["Check-In", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={`/goals/${goal.id}/check-ins`}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}

function SubmitButton({ form }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={form.submit}
          loading={form.submitting}
          size="lg"
          testId="submit-check-in"
          bzzzOnClickFailure
        >
          Submit Check-In
        </FilledButton>
      </div>
    </div>
  );
}
