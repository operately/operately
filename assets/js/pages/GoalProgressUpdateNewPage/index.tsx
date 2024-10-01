import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { PrimaryButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/goals/GoalCheckInForm";
import { Paths } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
      includeSpaceMembers: true,
      includeChampion: true,
      includeReviewer: true,
      includePotentialSubscribers: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ goal, mode: "create", potentialSubscribers: goal.potentialSubscribers! });

  return (
    <Pages.Page title={["Goal Progress Update", goal.name!]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Form form={form} />
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
        <PrimaryButton onClick={form.submit} loading={form.submitting} testId="submit-update">
          Submit Update
        </PrimaryButton>
      </div>
    </div>
  );
}
