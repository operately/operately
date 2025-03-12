import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { assertPresent } from "@/utils/assertions";
import { useForm, Form as CheckInForm } from "@/features/goals/GoalCheckIn";

import Forms from "@/components/Forms";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeSpace: true,
      includeTargets: true,
      includeReviewer: true,
      includePotentialSubscribers: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData() as LoaderResult;
  const title = ["Check-in", goal.name!];

  return (
    <Pages.Page title={title} testId="goal-check-in-new-page">
      <Paper.Root>
        <Navigation />

        <Paper.Body className="lg:px-28">
          <Header />
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { goal } = Pages.useLoadedData() as LoaderResult;

  return (
    <div>
      <h1 className="text-3xl font-bold text-center">Check-in: {goal.name}</h1>
      <p className="text-center mt-1">Share the progress with the team</p>
    </div>
  );
}

function Navigation() {
  const { goal } = Pages.useLoadedData() as LoaderResult;

  assertPresent(goal.space, "space must be present in goal");

  return (
    <Paper.Navigation>
      <Paper.NavSpaceLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavSpaceWorkMapLink space={goal.space} />
      <Paper.NavSeparator />
      <Paper.NavGoalLink goal={goal} />
    </Paper.Navigation>
  );
}

function Form() {
  const { goal } = Pages.useLoadedData() as LoaderResult;

  assertPresent(goal.space, "space must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm({ mode: "create", goal, subscriptionsState });

  return (
    <CheckInForm form={form} goal={goal} readonly={false}>
      <Spacer size={4} />
      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name!} />
      <Forms.Submit saveText="Check In" buttonSize="base" />
    </CheckInForm>
  );
}
