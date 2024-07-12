import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { FilledButton } from "@/components/Button";
import { Form, useForm } from "@/features/goals/GoalCheckInForm";
import { Paths } from "@/routes/paths";
import { DimmedLink } from "@/components/Link";

interface LoaderResult {
  checkIn: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const checkInPromise = GoalCheckIns.getGoalProgressUpdate({
    id: params.id,
    includeGoal: true,
  }).then((data) => data.update!);

  return {
    checkIn: await checkInPromise,
  };
}

export function Page() {
  const { checkIn } = Pages.useLoadedData<LoaderResult>();

  const form = useForm({ goal: checkIn.goal!, checkIn, mode: "edit" });

  return (
    <Pages.Page title={["Edit Goal Progress Update", checkIn.goal!.name!]}>
      <Paper.Root>
        <Navigation goal={checkIn.goal!} checkin={checkIn} />

        <Paper.Body>
          <Form form={form} />

          <div className="flex items-center gap-4 mt-8">
            <SubmitButton form={form} />
            <CancelLink checkin={checkIn} />
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
      <Paper.NavItem linkTo={Paths.goalProgressUpdatePath(checkin.id)}>Progress Update</Paper.NavItem>
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

function CancelLink({ checkin }: { checkin: GoalCheckIns.Update }) {
  return <DimmedLink to={Paths.goalProgressUpdatePath(checkin.id!)}>Cancel</DimmedLink>;
}
