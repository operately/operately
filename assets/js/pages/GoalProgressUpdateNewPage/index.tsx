import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as React from "react";

import { FilledButton } from "@/components/Button";
import { Form, useForm } from "@/features/goals/GoalCheckInForm";
import { InlinePeopleList } from "@/components/InlinePeopleList";
import { Paths } from "@/routes/paths";
import { useMe } from "@/contexts/CurrentUserContext";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
    }),
  };
}

export function Page() {
  const me = useMe();
  const { goal } = Pages.useLoadedData<LoaderResult>();

  const form = useForm({ goal, mode: "create" });

  return (
    <Pages.Page title={["Goal Progress Update", goal.name!]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Form form={form} />
          <WhoWillBeNotified goal={goal} me={me} />
          <SubmitButton form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.goalPath(goal.id)}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function SubmitButton({ form }) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-4">
        <FilledButton
          type="primary"
          onClick={form.submit}
          loading={form.submitting}
          testId="submit-update"
          bzzzOnClickFailure
        >
          Submit Update
        </FilledButton>
      </div>
    </div>
  );
}

function WhoWillBeNotified({ goal, me }: { goal: Goals.Goal; me: People.Person }) {
  const people = [goal.champion!, goal.reviewer!].filter((person) => person.id !== me.id);

  return (
    <div className="mt-8 font-medium">
      <p className="font-bold">When you submit:</p>
      <div className="inline-flex gap-1 flex-wrap mt-1">
        <InlinePeopleList people={people} /> will be notified.
      </div>
    </div>
  );
}
