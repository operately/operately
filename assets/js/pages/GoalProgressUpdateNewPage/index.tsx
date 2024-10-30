import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { Paths } from "@/routes/paths";
import { Form } from "@/features/goals/GoalCheckInForm";

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

  return (
    <Pages.Page title={["Goal Progress Update", goal.name!]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Form goal={goal} mode="create" />
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
