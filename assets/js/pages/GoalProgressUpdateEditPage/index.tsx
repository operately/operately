import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { Paths } from "@/routes/paths";
import { Form } from "@/features/goals/GoalCheckInForm";
import { assertPresent } from "@/utils/assertions";

interface LoaderResult {
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const checkInPromise = GoalCheckIns.getGoalProgressUpdate({
    id: params.id,
    includeGoalTargets: true,
    includeReviewer: true,
  }).then((data) => data.update!);

  return {
    update: await checkInPromise,
  };
}

export function Page() {
  const { update } = Pages.useLoadedData<LoaderResult>();

  assertPresent(update.goal, "goal must be present in update");

  return (
    <Pages.Page title={["Edit Goal Progress Update", update.goal.name!]}>
      <Paper.Root>
        <Navigation goal={update.goal} checkin={update} />

        <Paper.Body>
          <Form goal={update.goal} mode="edit" update={update} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal, checkin }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.goalPath(goal.id)}>{goal.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.goalProgressUpdatePath(checkin.id)}>Progress Update</Paper.NavItem>
    </Paper.Navigation>
  );
}
