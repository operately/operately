import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { FilledButton } from "@/components/Button";
import { Form, useForm } from "@/features/goals/GoalCheckInForm";
import { Paths } from "@/routes/paths";
import { DimmedLink } from "@/components/Link";

interface LoaderResult {
  goal: Goals.Goal;
  checkIn: GoalCheckIns.GoalCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
    }),
    checkIn: await GoalCheckIns.getCheckIn(params.id, {}),
  };
}

export function Page() {
  const { goal, checkIn } = Pages.useLoadedData<LoaderResult>();

  const form = useForm({ goal, checkIn, mode: "edit" });

  return (
    <Pages.Page title={["Edit Goal Progress Update", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} checkin={checkIn} />

        <Paper.Body>
          <Form form={form} />

          <div className="flex items-center gap-4 mt-8">
            <SubmitButton form={form} />
            <CancelLink goal={goal} checkin={checkIn} />
          </div>
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
      <Paper.NavItem linkTo={Paths.goalProgressUpdatePath(goal.id, checkin.id)}>Progress Update</Paper.NavItem>
    </Paper.Navigation>
  );
}

function SubmitButton({ form }) {
  return (
    <FilledButton
      type="primary"
      onClick={form.submit}
      loading={form.submitting}
      testId="submit-update"
      bzzzOnClickFailure
    >
      Save
    </FilledButton>
  );
}

function CancelLink({ goal, checkin }: { goal: Goals.Goal; checkin: GoalCheckIns.GoalCheckIn }) {
  return <DimmedLink to={Paths.goalProgressUpdatePath(goal.id, checkin.id)}>Cancel</DimmedLink>;
}
